import type { ActionFunctionArgs } from "react-router";
import { calculateSignalToNoise } from "./analyze";
import { readFileSync } from "fs";
import { join } from "path";
import prisma from "../db.server";

// Helper function to upgrade Twitter profile picture URLs to higher resolution
function upgradeProfilePictureUrl(url: string | null): string | null {
    if (!url) return null;

    // Replace _normal with _400x400 for higher resolution
    // Twitter supports: _normal (48x48), _bigger (73x73), _400x400 (400x400)
    return url.replace('_normal.jpg', '_400x400.jpg').replace('_normal.png', '_400x400.png');
}

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

async function getRanking(username: string, signalToNoiseRatio: number) {
    try {
        const allAnalyses = await prisma.analysis.findMany({
            orderBy: {
                signalToNoiseRatio: 'desc'
            },
            select: {
                username: true,
                signalToNoiseRatio: true
            }
        });

        const userRank = allAnalyses.findIndex((analysis: { username: string; signalToNoiseRatio: number }) => analysis.username === username.toLowerCase()) + 1;
        const totalUsers = allAnalyses.length;

        // Return top score for frontend percentage calculation
        const topScore = allAnalyses.length > 0 ? allAnalyses[0].signalToNoiseRatio : 0;

        return {
            rank: userRank > 0 ? userRank : null,
            totalUsers,
            topScore
        };
    } catch (error) {
        console.error("Error getting ranking:", error);
        return {
            rank: null,
            totalUsers: 0,
            topScore: 0
        };
    }
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

                // Get display name from test data
                const displayName = testData.tweets.length > 0 && testData.tweets[0].author?.name ? testData.tweets[0].author.name : null;

                // Get profile picture from first tweet's author (if available)
                const profilePicture = upgradeProfilePictureUrl(testData.tweets.length > 0 ? testData.tweets[0].author?.profilePicture : null);
                const coverPicture = testData.tweets.length > 0 ? testData.tweets[0].author?.coverPicture : null;

                // Get ranking information
                const ranking = await getRanking(username, signalToNoiseRatio);

                return {
                    success: true,
                    username,
                    displayName,
                    tweets: testData.tweets,
                    totalTweets: testData.tweets.length,
                    apiResponse: testData.fullApiResponse, // For debugging
                    signalToNoiseRatio,
                    profilePicture,
                    coverPicture,
                    fromCache: false,
                    testMode: true,
                    rank: ranking.rank,
                    totalUsers: ranking.totalUsers,
                    topScore: ranking.topScore,
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

                // Get ranking information
                const ranking = await getRanking(username, existingAnalysis.signalToNoiseRatio);

                return {
                    success: true,
                    username,
                    displayName: existingAnalysis.displayName,
                    tweets: [], // We don't store tweets, just return empty array
                    totalTweets: 0,
                    signalToNoiseRatio: existingAnalysis.signalToNoiseRatio,
                    profilePicture: existingAnalysis.profilePicture,
                    coverPicture: existingAnalysis.coverPicture,
                    fromCache: true,
                    analyzedAt: existingAnalysis.createdAt,
                    rank: ranking.rank,
                    totalUsers: ranking.totalUsers,
                    topScore: ranking.topScore,
                };
            }
        } catch (error) {
            console.error("Database error:", error);
            // Continue with API fetch even if database fails
        }
    } else {
        // Check if refresh is being forced but within cooldown period
        try {
            const existingAnalysis = await prisma.analysis.findUnique({
                where: { username: username.toLowerCase() }
            });

            if (existingAnalysis) {
                const now = new Date();
                const lastAnalysis = existingAnalysis.updatedAt;
                const timeDifferenceMs = now.getTime() - lastAnalysis.getTime();
                const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));
                const cooldownMinutes = 60; // 1 hour cooldown

                if (timeDifferenceMinutes < cooldownMinutes) {
                    const remainingMinutes = cooldownMinutes - timeDifferenceMinutes;
                    return {
                        success: false,
                        error: "refresh_cooldown",
                        remainingMinutes,
                        cooldownMinutes,
                    };
                }
            }
        } catch (error) {
            console.error("Database error checking cooldown:", error);
            // Continue with refresh even if database check fails
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

        // Get display name from tweets (using the first tweet's author name)
        let displayName: string | null = null;
        if (tweets.length > 0 && tweets[0].author?.name) {
            displayName = tweets[0].author.name;
        }

        // Get user info for higher quality profile picture and banner
        let profilePicture = null;
        let coverPicture = null;

        try {
            const userInfoUrl = new URL("https://api.twitterapi.io/twitter/user/info");
            userInfoUrl.searchParams.set("userName", username);

            const userInfoResponse = await fetch(userInfoUrl.toString(), {
                method: "GET",
                headers: {
                    "X-API-Key": apiKey,
                },
            });

            if (userInfoResponse.ok) {
                const userInfoData = await userInfoResponse.json();
                if (userInfoData.status === "success" && userInfoData.data) {
                    profilePicture = upgradeProfilePictureUrl(userInfoData.data.profilePicture);
                    coverPicture = userInfoData.data.coverPicture;
                    console.log(`Fetched user info for @${username}`);
                }
            } else {
                console.warn(`Failed to fetch user info for @${username}, using fallback from tweets`);
                // Fallback to profile picture from tweets if user info API fails
                profilePicture = upgradeProfilePictureUrl(tweets.length > 0 ? tweets[0].author?.profilePicture : null);
            }
        } catch (error) {
            console.warn("Error fetching user info, using fallback:", error);
            // Fallback to profile picture from tweets if user info API fails
            profilePicture = upgradeProfilePictureUrl(tweets.length > 0 ? tweets[0].author?.profilePicture : null);
        }

        // Save analysis to database (create or update)
        try {
            await prisma.analysis.upsert({
                where: { username: username.toLowerCase() },
                update: {
                    displayName,
                    profilePicture,
                    coverPicture,
                    signalToNoiseRatio,
                },
                create: {
                    username: username.toLowerCase(),
                    displayName,
                    profilePicture,
                    coverPicture,
                    signalToNoiseRatio,
                }
            });
            console.log(`Saved analysis for @${username} to database`);
        } catch (error) {
            console.error("Failed to save analysis to database:", error);
            // Continue even if database save fails
        }

        // Get ranking information
        const ranking = await getRanking(username, signalToNoiseRatio);

        return {
            success: true,
            username,
            displayName,
            tweets: tweets,
            totalTweets: tweets.length,
            apiResponse: data, // For debugging
            signalToNoiseRatio,
            profilePicture,
            coverPicture,
            fromCache: false,
            rank: ranking.rank,
            totalUsers: ranking.totalUsers,
            topScore: ranking.topScore,
        };

    } catch (error) {
        console.error("Error fetching tweets:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
