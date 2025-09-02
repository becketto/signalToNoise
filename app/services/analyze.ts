import type { Tweet } from "./getTweets";

// Advanced signal-to-noise calculation with weighted scoring system
export function calculateSignalToNoise(tweets: Tweet[]): number {
    if (!tweets || tweets.length === 0) return 0;

    let totalScore = 0;
    let totalTweets = tweets.length;

    tweets.forEach(tweet => {
        let tweetScore = 0;
        const followerCount = tweet.author.followers;

        // 3. Content type analysis (check retweet status first)
        const hasText = tweet.text && tweet.text.trim().length > 0;
        const hasImage = hasMediaContent(tweet);
        const isQuote = isQuoteTweet(tweet);
        const isRetweet = isRetweetContent(tweet);

        // Retweets: -200 points (major negative signal - retweets indicate low original content)
        // Skip ALL positive scoring for retweets since engagement belongs to original author
        if (isRetweet) {
            tweetScore -= 100;
        } else {
            // Only calculate engagement scores for original content (not retweets)

            // 1. Ratio of likes to follower count (200 points weight)
            const likeScore = calculateLikeScore(tweet.likeCount, followerCount);
            tweetScore += likeScore * 200;

            // 2. Ratio of replies to follower count (100 points weight)  
            const replyScore = calculateReplyScore(tweet.replyCount, followerCount);
            tweetScore += replyScore * 100;

            // 6. Bookmark scoring (additive points with diminishing returns)
            const bookmarkPoints = calculateBookmarkPoints(tweet.bookmarkCount, followerCount);
            tweetScore += bookmarkPoints;
        }

        // Text and image: 50 points (only if not a retweet)
        if (hasText && hasImage && !isQuote && !isRetweet) {
            tweetScore += 50;
        }

        // Quote tweet: -50 points (only if not a retweet)
        if (isQuote && !isRetweet) {
            tweetScore -= 50;
        }

        // Text, image, and quote: 75 points (only if not a retweet)
        if (hasText && hasImage && isQuote && !isRetweet) {
            tweetScore += 75;
        }

        // 3. Under five words: -100 points
        const wordCount = tweet.text.trim().split(/\s+/).length;
        if (wordCount < 5) {
            tweetScore -= 100;
        }

        // 4. Hashtags: -200 points per hashtag
        const hashtagCount = tweet.entities?.hashtags?.length || 0;
        tweetScore -= hashtagCount * 200;

        // 5. External links: -50 points
        if (hasExternalLink(tweet)) {
            tweetScore -= 50;
        }

        // 6. Text complexity penalty (overly complex = noise)
        const complexityPenalty = calculateComplexityPenalty(tweet.text);
        tweetScore -= complexityPenalty;

        // 7. Em dash penalty: -200 points per em dash
        const emDashCount = countEmDashes(tweet.text);
        tweetScore -= emDashCount * 200;

        totalScore += tweetScore;
    });

    // Return average score per tweet, normalized to a reasonable scale
    const averageScore = totalScore / totalTweets;

    // Improved normalization logic that's more sensitive to negative scores
    // The previous logic was too forgiving and could give high scores to accounts with many retweets
    let normalizedScore: number;

    if (averageScore <= -200) {
        // Heavy penalty for accounts with lots of retweets/negative signals
        normalizedScore = Math.max(0, 10 + (averageScore + 200) / 50);
    } else if (averageScore <= 0) {
        // Moderate penalty for negative scores
        normalizedScore = Math.max(0, 20 + (averageScore / 10));
    } else if (averageScore <= 200) {
        // Linear scaling for modest positive scores
        normalizedScore = 20 + (averageScore / 200) * 30; // Maps 0-200 to 20-50
    } else if (averageScore <= 500) {
        // Good scores get better treatment
        normalizedScore = 50 + ((averageScore - 200) / 300) * 30; // Maps 200-500 to 50-80
    } else {
        // Excellent scores (rare) get the highest ratings
        normalizedScore = 80 + Math.min(20, (averageScore - 500) / 100); // Maps 500+ to 80-100
    }

    return Math.round(Math.max(0, Math.min(100, normalizedScore)) * 100) / 100;
}

// Helper function to calculate like score using power-law engagement modeling
function calculateLikeScore(likes: number, followers: number): number {
    if (likes === 0) return 0.1; // Minimal score for zero engagement

    // Power-law model: engagement rate typically follows EngagementRate ∝ Followers^(-α)
    // where α ≈ 0.1-0.3 based on social media research
    const powerLawExponent = 0.2; // Empirically derived decay rate

    // Expected engagement rate based on follower count using power law
    const baseEngagementRate = 0.05; // 5% baseline for small accounts
    const expectedEngagementRate = baseEngagementRate * Math.pow(followers, -powerLawExponent);
    const expectedLikes = Math.max(1, expectedEngagementRate * followers);

    // Calculate actual vs expected performance in log space for better scaling
    const logActual = Math.log10(likes);
    const logExpected = Math.log10(expectedLikes);
    const logPerformanceRatio = logActual - logExpected;

    // Use sigmoid function for smooth, bounded scoring
    // This prevents extreme scores while rewarding over-performance
    const sigmoidSteepness = 2.0; // Controls how quickly score changes
    const sigmoidScore = 1 / (1 + Math.exp(-logPerformanceRatio * sigmoidSteepness));

    // Apply engagement rate penalty for extremely large accounts
    // This addresses audience dilution effects
    const actualEngagementRate = likes / followers;
    const dilutionPenalty = Math.max(0.1, Math.min(1.0, actualEngagementRate / 0.001)); // Penalty if < 0.1% rate

    // Combine performance score with dilution penalty
    const finalScore = sigmoidScore * dilutionPenalty;

    return Math.max(0.1, Math.min(1.0, finalScore));
}

// Helper function to calculate reply score using power-law engagement modeling
function calculateReplyScore(replies: number, followers: number): number {
    if (replies === 0) return 0.2; // Higher baseline than likes since replies are rarer

    // Power-law model for replies - typically 5-10x lower rate than likes
    const powerLawExponent = 0.25; // Slightly higher decay than likes
    const baseReplyRate = 0.008; // 0.8% baseline reply rate for small accounts

    const expectedReplyRate = baseReplyRate * Math.pow(followers, -powerLawExponent);
    const expectedReplies = Math.max(1, expectedReplyRate * followers);

    // Calculate performance ratio in log space
    const logActual = Math.log10(replies);
    const logExpected = Math.log10(expectedReplies);
    const logPerformanceRatio = logActual - logExpected;

    // Sigmoid scoring with higher steepness for replies (more discriminating)
    const sigmoidSteepness = 2.5;
    const sigmoidScore = 1 / (1 + Math.exp(-logPerformanceRatio * sigmoidSteepness));

    // Engagement rate penalty (replies are more valuable than likes)
    const actualReplyRate = replies / followers;
    const dilutionPenalty = Math.max(0.2, Math.min(1.0, actualReplyRate / 0.0005)); // Penalty if < 0.05% rate

    const finalScore = sigmoidScore * dilutionPenalty;

    return Math.max(0.2, Math.min(1.0, finalScore));
}

// Helper function to detect if tweet has media content (images, videos, etc.)
function hasMediaContent(tweet: Tweet): boolean {
    // Check if tweet has media entities or URLs that might indicate images
    const hasUrls = tweet.entities?.urls?.length > 0;
    const hasTwitterUrls = tweet.text.includes('pic.twitter.com') || tweet.text.includes('https://t.co/');

    return hasUrls || hasTwitterUrls;
}

// Helper function to detect if tweet is a quote tweet
function isQuoteTweet(tweet: Tweet): boolean {
    return tweet.quoted_tweet && Object.keys(tweet.quoted_tweet).length > 0;
}

// Helper function to detect if tweet is a retweet
function isRetweetContent(tweet: Tweet): boolean {
    // Check if tweet has retweeted_tweet data
    if (tweet.retweeted_tweet && Object.keys(tweet.retweeted_tweet).length > 0) {
        return true;
    }

    // Check if text starts with "RT @" (classic retweet format)
    if (tweet.text && tweet.text.trim().startsWith('RT @')) {
        return true;
    }

    return false;
}

// Helper function to calculate bookmark points using power-law engagement modeling
function calculateBookmarkPoints(bookmarks: number, followers: number): number {
    if (bookmarks === 0) return 0; // No penalty for no bookmarks

    // Power-law model for bookmarks - typically 10-20x lower rate than likes
    const powerLawExponent = 0.3; // Higher decay since bookmarks are more selective
    const baseBookmarkRate = 0.002; // 0.2% baseline bookmark rate for small accounts

    const expectedBookmarkRate = baseBookmarkRate * Math.pow(followers, -powerLawExponent);
    const expectedBookmarks = Math.max(0.1, expectedBookmarkRate * followers);

    // Calculate performance ratio in log space
    const logActual = Math.log10(Math.max(bookmarks, 0.1));
    const logExpected = Math.log10(expectedBookmarks);
    const logPerformanceRatio = logActual - logExpected;

    // Sigmoid scoring for bookmarks with moderate steepness
    const sigmoidSteepness = 1.8;
    const rawScore = 1 / (1 + Math.exp(-logPerformanceRatio * sigmoidSteepness));

    // Bookmark rate bonus - bookmarks are highly valuable signal
    const actualBookmarkRate = bookmarks / followers;
    const rateMultiplier = Math.min(2.0, 1 + actualBookmarkRate * 1000); // Up to 2x multiplier

    // Convert to points (0-150 scale for bookmarks)
    const maxBookmarkPoints = 150;
    const points = rawScore * rateMultiplier * maxBookmarkPoints;

    return Math.round(Math.max(0, Math.min(maxBookmarkPoints, points)));
}

// Helper function to detect external links
function hasExternalLink(tweet: Tweet): boolean {
    // Check for URLs that aren't Twitter's own media or quote tweet links
    if (!tweet.entities?.urls?.length) {
        return false;
    }

    return tweet.entities.urls.some(url => {
        const expandedUrl = url.expanded_url?.toLowerCase() || '';
        return !expandedUrl.includes('twitter.com') &&
            !expandedUrl.includes('pic.twitter.com') &&
            !expandedUrl.includes('t.co');
    });
}

// Helper function to calculate complexity penalty
function calculateComplexityPenalty(text: string): number {
    if (!text || text.trim().length === 0) return 0;

    let penalty = 0;

    // Average word length penalty (overly complex words)
    const words = text.trim().split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (avgWordLength > 8) {
        penalty += (avgWordLength - 8) * 20; // Penalty scales with complexity
    }

    // Sentence length penalty (overly long sentences)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, sentence) => {
        return sum + sentence.trim().split(/\s+/).length;
    }, 0) / sentences.length;

    if (avgSentenceLength > 25) {
        penalty += (avgSentenceLength - 25) * 5;
    }

    // Excessive punctuation penalty
    const punctuationCount = (text.match(/[;:()[\]{}]/g) || []).length;
    if (punctuationCount > 5) {
        penalty += (punctuationCount - 5) * 10;
    }

    return Math.round(penalty);
}

// Helper function to count em dashes
function countEmDashes(text: string): number {
    // Count both em dashes (—) and double hyphens (--)
    const emDashes = (text.match(/—/g) || []).length;
    const doubleHyphens = (text.match(/--/g) || []).length;
    return emDashes + doubleHyphens;
}