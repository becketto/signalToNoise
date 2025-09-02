import type { ActionFunctionArgs } from "react-router";
import { calculateSignalToNoise } from "./analyze";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

export interface Tweet {
    type: string;
    id: string;
    url: string;
    text: string;
    source: string;
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    quoteCount: number;
    viewCount: number;
    createdAt: string;
    lang: string;
    bookmarkCount: number;
    isReply: boolean;
    inReplyToId?: string;
    conversationId: string;
    displayTextRange: number[];
    inReplyToUserId?: string;
    inReplyToUsername?: string;
    author: {
        type: string;
        userName: string;
        url: string;
        id: string;
        name: string;
        isBlueVerified: boolean;
        verifiedType: string;
        profilePicture: string;
        coverPicture: string;
        description: string;
        location: string;
        followers: number;
        following: number;
        canDm: boolean;
        createdAt: string;
        favouritesCount: number;
        hasCustomTimelines: boolean;
        isTranslator: boolean;
        mediaCount: number;
        statusesCount: number;
        withheldInCountries: string[];
        affiliatesHighlightedLabel: Record<string, any>;
        possiblySensitive: boolean;
        pinnedTweetIds: string[];
        isAutomated: boolean;
        automatedBy: string;
        unavailable: boolean;
        message: string;
        unavailableReason: string;
        profile_bio: {
            description: string;
            entities: {
                description: {
                    urls: Array<{
                        display_url: string;
                        expanded_url: string;
                        indices: number[];
                        url: string;
                    }>;
                };
                url: {
                    urls: Array<{
                        display_url: string;
                        expanded_url: string;
                        indices: number[];
                        url: string;
                    }>;
                };
            };
        };
    };
    entities: {
        hashtags: Array<{
            indices: number[];
            text: string;
        }>;
        urls: Array<{
            display_url: string;
            expanded_url: string;
            indices: number[];
            url: string;
        }>;
        user_mentions: Array<{
            id_str: string;
            name: string;
            screen_name: string;
        }>;
    };
    quoted_tweet: Record<string, any>;
    retweeted_tweet: Record<string, any>;
    isLimitedReply: boolean;
}

export interface TwitterAPIResponse {
    status: string;
    code: number;
    msg: string;
    data: {
        pin_tweet: any;
        tweets: Tweet[];
        has_next_page?: boolean;
        next_cursor?: string;
    };
}

export async function getTweets(username: string, forceRefresh: boolean = false, useTestData: boolean = false) {

    if (!username) {
        return {
            success: false,
            error: "Username is required",
        };
    }

    // Test mode: load from JSON file if enabled and username is ecombeckett
    if (useTestData && username.toLowerCase() === 'ecombeckett') {
        try {
            const testDataPath = join(process.cwd(), 'ecombeckett-tweets.json');
            const testDataContent = readFileSync(testDataPath, 'utf-8');
            const testData = JSON.parse(testDataContent);

            if (testData.success && testData.tweets) {
                console.log(`Using test data for @${username} with ${testData.tweets.length} tweets`);

                // Calculate signal to noise ratio
                const signalToNoiseRatio = calculateSignalToNoise(testData.tweets);

                // Get profile picture from first tweet's author (if available)
                const profilePicture = testData.tweets.length > 0 ? testData.tweets[0].author?.profilePicture : null;

                return {
                    success: true,
                    username,
                    tweets: testData.tweets,
                    totalTweets: testData.tweets.length,
                    apiResponse: testData.fullApiResponse, // For debugging
                    signalToNoiseRatio,
                    profilePicture,
                    fromCache: false,
                    testMode: true,
                };
            }
        } catch (error) {
            console.error("Error loading test data:", error);
            // Fall through to normal API fetch
        }
    }

    // Check database for existing analysis (unless forcing refresh)
    if (!forceRefresh) {
        try {
            const existingAnalysis = await prisma.analysis.findUnique({
                where: { username: username.toLowerCase() }
            });

            if (existingAnalysis) {
                console.log(`Found existing analysis for @${username}`);
                return {
                    success: true,
                    username,
                    tweets: [], // We don't store tweets, just return empty array
                    totalTweets: 0,
                    signalToNoiseRatio: existingAnalysis.signalToNoiseRatio,
                    profilePicture: existingAnalysis.profilePicture,
                    fromCache: true,
                    analyzedAt: existingAnalysis.createdAt,
                };
            }
        } catch (error) {
            console.error("Database error:", error);
            // Continue with API fetch even if database fails
        }
    }

    // Check if API key is configured
    const apiKey = process.env.TWITTER_API_KEY;
    if (!apiKey) {
        return {
            success: false,
            error: "Twitter API key not configured",
        };
    }

    try {
        // Fetch tweets from TwitterAPI.io (API returns up to 20 tweets per page)
        const url = new URL("https://api.twitterapi.io/twitter/user/last_tweets");
        url.searchParams.set("userName", username);

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "X-API-Key": apiKey,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
            return {
                success: false,
                error: `Failed to fetch tweets: ${response.status} ${response.statusText}`,
            };
        }

        const data = await response.json();
        console.log("API Response structure:", JSON.stringify({ status: data.status, hasData: !!data.data, tweetCount: data.data?.tweets?.length }));

        if (data.status !== "success") {
            console.error("API returned error:", data.msg || data.message);
            return {
                success: false,
                error: data.msg || data.message || "Failed to fetch tweets",
            };
        }

        // Validate that data and tweets array exists
        if (!data.data || !data.data.tweets || !Array.isArray(data.data.tweets)) {
            console.error("Invalid API response structure:", {
                hasData: !!data.data,
                hasTweets: !!data.data?.tweets,
                isArray: Array.isArray(data.data?.tweets)
            });
            return {
                success: false,
                error: "Invalid response format from Twitter API",
            };
        }

        const tweets = data.data.tweets;
        console.log(`Fetched ${tweets.length} tweets for @${username}`);

        // Calculate signal to noise ratio
        const signalToNoiseRatio = calculateSignalToNoise(tweets);

        // Get profile picture from first tweet's author (if available)
        const profilePicture = tweets.length > 0 ? tweets[0].author?.profilePicture : null;

        // Save analysis to database (create or update)
        try {
            await prisma.analysis.upsert({
                where: { username: username.toLowerCase() },
                update: {
                    profilePicture,
                    signalToNoiseRatio,
                },
                create: {
                    username: username.toLowerCase(),
                    profilePicture,
                    signalToNoiseRatio,
                }
            });
            console.log(`Saved analysis for @${username} to database`);
        } catch (error) {
            console.error("Failed to save analysis to database:", error);
            // Continue even if database save fails
        }

        return {
            success: true,
            username,
            tweets: tweets,
            totalTweets: tweets.length,
            apiResponse: data, // For debugging
            signalToNoiseRatio,
            profilePicture,
            fromCache: false,
        };

    } catch (error) {
        console.error("Error fetching tweets:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
