import { Box, Button, Heading, VStack, Text, HStack, Badge, Link, SimpleGrid } from "@chakra-ui/react"
import { useLoaderData, Link as RemixLink } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { getTweets, type Tweet } from "../services/getTweets"

export function meta({ params }: { params: { username: string } }) {
    return [
        { title: `Signal to Noise - @${params.username}` },
        { name: "description", content: `Signal to noise ratio analysis for @${params.username}` },
    ]
}

export async function loader({ params, request }: LoaderFunctionArgs) {
    const username = params.username;
    const url = new URL(request.url);
    const refresh = url.searchParams.get('refresh');
    const test = url.searchParams.get('test');

    if (!username) {
        throw new Response("Username required", { status: 400 });
    }

    const result = await getTweets(username, refresh === 'true', test === 'true');
    return result;
}

export default function SignalToNoise() {
    const data = useLoaderData<typeof loader>();

    if (!data.success) {
        return (
            <Box
                minH="100vh"
                bg="gray.900"
                color="white"
                p="8"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
            >
                <VStack gap="6" w="full" maxW="md">
                    <Heading fontSize="2xl" color="red.400">Error</Heading>
                    <Text color="gray.300" textAlign="center">{data.error}</Text>
                    <RemixLink to="/">
                        <Button colorScheme="blue">Go Back</Button>
                    </RemixLink>
                </VStack>
            </Box>
        );
    }

    return (
        <Box
            minH="100vh"
            bg="gray.900"
            color="white"
            p="8"
        >
            <VStack gap="8" w="full" maxW="6xl" mx="auto">
                {/* Header */}
                <HStack w="full" justify="space-between" align="center">
                    <VStack align="start" gap="2">
                        <Heading fontSize="3xl" fontWeight="medium">
                            Signal to Noise Analysis
                        </Heading>
                        <Text fontSize="lg" color="gray.300">@{data.username}</Text>
                    </VStack>
                    <RemixLink to="/">
                        <Button variant="outline" colorScheme="blue">
                            Analyze Another
                        </Button>
                    </RemixLink>
                </HStack>

                {/* Signal to Noise Ratio Display */}
                <Box bg="gray.800" border="1px solid" borderColor="gray.700" w="full" p="6" borderRadius="md">
                    <VStack gap="4">
                        {data.fromCache && (
                            <HStack w="full" justify="center">
                                <Badge colorScheme="blue" fontSize="sm">
                                    Cached Result - {data.analyzedAt ? new Date(data.analyzedAt).toLocaleDateString() : 'Previously analyzed'}
                                </Badge>
                            </HStack>
                        )}

                        {data.testMode && (
                            <HStack w="full" justify="center">
                                <Badge colorScheme="purple" fontSize="sm">
                                    Test Mode - Using Local JSON Data
                                </Badge>
                            </HStack>
                        )}

                        <SimpleGrid columns={2} gap="8" textAlign="center">
                            <VStack>
                                <Text color="gray.400" fontSize="sm">Signal to Noise Ratio</Text>
                                <Text
                                    fontSize="4xl"
                                    fontWeight="bold"
                                    color={(data.signalToNoiseRatio || 0) > 0.5 ? "green.400" : (data.signalToNoiseRatio || 0) > 0.2 ? "yellow.400" : "red.400"}
                                >
                                    {data.signalToNoiseRatio || 0}
                                </Text>
                                <Text color="gray.400" fontSize="sm">
                                    {(data.signalToNoiseRatio || 0) > 0.5 ? "High Signal" : (data.signalToNoiseRatio || 0) > 0.2 ? "Moderate Signal" : "Low Signal"}
                                </Text>
                            </VStack>

                            <VStack>
                                <Text color="gray.400" fontSize="sm">Tweets</Text>
                                <Text fontSize="2xl" fontWeight="bold">{data.fromCache ? "N/A" : data.totalTweets}</Text>
                                <Text color="gray.400" fontSize="sm">{data.fromCache ? "Cached" : "Analyzed"}</Text>
                            </VStack>
                        </SimpleGrid>
                    </VStack>
                </Box>

                {/* Debug Information */}
                <Box w="full">
                    <Heading fontSize="lg" color="blue.400" mb="4">Debug Information</Heading>
                    <VStack gap="4" align="start">
                        <Box bg="gray.800" p="4" borderRadius="md" w="full">
                            <Text fontWeight="semibold" color="blue.400" mb="2">API Response Summary:</Text>
                            <VStack align="start" gap="1" pl="4" fontSize="sm">
                                <Text><strong>Status:</strong> {data.apiResponse?.status}</Text>
                                <Text><strong>Code:</strong> {data.apiResponse?.code}</Text>
                                <Text><strong>Message:</strong> {data.apiResponse?.msg}</Text>
                                <Text><strong>Has Pin Tweet:</strong> {data.apiResponse?.data?.pin_tweet ? "Yes" : "No"}</Text>
                                <Text><strong>Tweets Returned:</strong> {data.apiResponse?.data?.tweets?.length || 0}</Text>
                            </VStack>
                        </Box>

                        <Box bg="gray.800" p="4" borderRadius="md" w="full">
                            <Text fontWeight="semibold" color="blue.400" mb="2">Raw API Response:</Text>
                            <Box
                                as="pre"
                                bg="gray.900"
                                p="4"
                                borderRadius="md"
                                overflow="auto"
                                fontSize="xs"
                                border="1px solid"
                                borderColor="gray.600"
                                maxH="400px"
                                whiteSpace="pre-wrap"
                            >
                                {JSON.stringify(data.apiResponse, null, 2)}
                            </Box>
                        </Box>
                    </VStack>
                </Box>

                {/* Tweets Display */}
                {!data.fromCache && (
                    <Box bg="gray.800" border="1px solid" borderColor="gray.700" w="full" p="6" borderRadius="md">
                        <VStack gap="4" align="start">
                            <Heading fontSize="xl" color="blue.400">Recent Tweets</Heading>
                            <VStack gap="4" w="full" align="start">
                                {data.tweets.slice(0, 10).map((tweet: Tweet) => (
                                    <Box key={tweet.id} bg="gray.700" w="full" p="4" borderRadius="md">
                                        <VStack gap="3" align="start">
                                            <HStack gap="2" wrap="wrap">
                                                <Badge colorScheme={tweet.text.startsWith('RT @') ? "red" : "green"}>
                                                    {tweet.text.startsWith('RT @') ? "Retweet" : "Original"}
                                                </Badge>
                                                <Badge variant="outline">{tweet.lang}</Badge>
                                                {tweet.isReply && <Badge colorScheme="purple">Reply</Badge>}
                                            </HStack>

                                            <Text fontSize="sm" lineHeight="1.5">
                                                {tweet.text.length > 200 ? `${tweet.text.substring(0, 200)}...` : tweet.text}
                                            </Text>

                                            <HStack gap="4" fontSize="sm" color="gray.400" wrap="wrap">
                                                <Text>❤️ {tweet.likeCount.toLocaleString()}</Text>
                                                <Text>🔄 {tweet.retweetCount.toLocaleString()}</Text>
                                                <Text>💬 {tweet.replyCount.toLocaleString()}</Text>
                                                <Text>👀 {tweet.viewCount.toLocaleString()}</Text>
                                            </HStack>

                                            <HStack gap="2" fontSize="xs" color="gray.500">
                                                <Text>{new Date(tweet.createdAt).toLocaleDateString()}</Text>
                                                <Link href={tweet.url} target="_blank" color="blue.400">
                                                    View Tweet
                                                </Link>
                                            </HStack>
                                        </VStack>
                                    </Box>
                                ))}

                                {data.tweets.length > 10 && (
                                    <Text fontSize="sm" color="gray.400" textAlign="center" w="full">
                                        ... and {data.tweets.length - 10} more tweets
                                    </Text>
                                )}
                            </VStack>
                        </VStack>
                    </Box>
                )}

                {data.fromCache && (
                    <Box bg="gray.800" border="1px solid" borderColor="gray.700" w="full" p="6" borderRadius="md">
                        <VStack gap="4" align="center">
                            <Heading fontSize="xl" color="blue.400">Cached Analysis</Heading>
                            <Text color="gray.300" textAlign="center">
                                This analysis was previously computed and saved. Tweets are not stored for privacy.
                            </Text>
                            <RemixLink to={`/signaltonoise/${data.username}?refresh=true`}>
                                <Button colorScheme="blue" variant="outline">
                                    Refresh Analysis
                                </Button>
                            </RemixLink>
                        </VStack>
                    </Box>
                )}

                {/* Footer */}
                <Box textAlign="center" pt="8">
                    <Text fontSize="sm" color="gray.400">
                        Analysis based on {data.totalTweets} tweets • Signal calculation considers engagement, length, and originality
                    </Text>
                </Box>
            </VStack>
        </Box>
    )
}
