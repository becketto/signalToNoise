import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fetchTweetsRaw(username, count = 50) {
    const apiKey = process.env.TWITTER_API_KEY;
    if (!apiKey) {
        return {
            success: false,
            error: "Twitter API key not configured",
        };
    }

    try {
        const url = new URL("https://api.twitterapi.io/twitter/user/last_tweets");
        url.searchParams.set("userName", username);
        if (count && count !== 20) {
            url.searchParams.set("count", count.toString());
        }

        console.log(`Calling API for @${username}...`);
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
        console.log(`Successfully fetched ${tweets.length} tweets for @${username}`);

        return {
            success: true,
            username,
            tweets: tweets,
            totalTweets: tweets.length,
            requestedCount: count,
            fullApiResponse: data,
        };

    } catch (error) {
        console.error("Error fetching tweets:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}

async function main() {
    console.log('Fetching tweets for @ecombeckett...');

    try {
        const result = await fetchTweetsRaw('ecombeckett', 50);

        console.log('Result received, saving to file...');

        // Save the full response to a JSON file
        const outputPath = join(__dirname, 'ecombeckett-tweets.json');
        writeFileSync(outputPath, JSON.stringify(result, null, 2));

        console.log(`\nData saved to: ${outputPath}`);
        console.log(`Success: ${result.success}`);

        if (result.success) {
            console.log(`Username: ${result.username}`);
            console.log(`Total tweets: ${result.totalTweets}`);

            // Log some sample tweet data structure for debugging
            if (result.tweets && result.tweets.length > 0) {
                console.log('\nFirst few tweet texts:');
                result.tweets.slice(0, 3).forEach((tweet, i) => {
                    console.log(`${i + 1}. ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? '...' : ''}`);
                });
            }
        } else {
            console.log(`Error: ${result.error}`);
        }

    } catch (error) {
        console.error('Error running script:', error);
        process.exit(1);
    }
}

main();