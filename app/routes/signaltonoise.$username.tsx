import {
    Badge,
    Box,
    Button,
    Circle,
    Flex,
    Heading,
    HStack,
    Image,
    Link,
    Text,
    VStack
} from "@chakra-ui/react"
import { useLoaderData, Link as RemixLink } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { getTweets } from "../services/getTweets"

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

    const getRankColor = (rank: number | null) => {
        if (!rank) return "gray.400";
        if (rank === 1) return "yellow.400";
        if (rank <= 3) return "orange.400";
        if (rank <= 10) return "green.400";
        return "blue.400";
    };

    const getSignalColor = () => {
        const ratio = data.signalToNoiseRatio || 0;
        if (ratio > 0.5) return "green.400";
        if (ratio > 0.2) return "yellow.400";
        return "red.400";
    };

    const getSignalLabel = () => {
        const ratio = data.signalToNoiseRatio || 0;
        if (ratio > 0.5) return "High Signal";
        if (ratio > 0.2) return "Moderate Signal";
        return "Low Signal";
    };

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
            <VStack gap="8" w="full" maxW="lg">
                {/* Main Card */}
                <Box
                    bg="gray.800"
                    borderColor="gray.700"
                    borderWidth="1px"
                    w="full"
                    boxShadow="2xl"
                    borderRadius="xl"
                    _hover={{
                        borderColor: "gray.600",
                        transform: "translateY(-4px)",
                        boxShadow: "3xl"
                    }}
                    transition="all 0.3s ease"
                    p="8"
                >
                    <VStack gap="6" textAlign="center">
                        {/* Profile Section with Banner */}
                        <VStack gap="4" w="full">
                            {/* Banner and Profile Picture Container */}
                            <Box w="full" position="relative">
                                {/* Banner Image */}
                                <Box
                                    w="full"
                                    h="160px"
                                    borderRadius="xl"
                                    overflow="hidden"
                                    bg="gray.700"
                                    position="relative"
                                >
                                    {data.coverPicture ? (
                                        <Image
                                            src={data.coverPicture}
                                            alt={`@${data.username} banner`}
                                            w="full"
                                            h="full"
                                            objectFit="cover"
                                        />
                                    ) : (
                                        <Box
                                            w="full"
                                            h="full"
                                            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                        />
                                    )}
                                </Box>

                                {/* Profile Picture Overlaid on Banner */}
                                <Circle
                                    size="120px"
                                    bg="gray.600"
                                    border="4px solid"
                                    borderColor="gray.800"
                                    overflow="hidden"
                                    position="absolute"
                                    bottom="-60px"
                                    left="50%"
                                    transform="translateX(-50%)"
                                    zIndex="1"
                                >
                                    {data.profilePicture ? (
                                        <Image
                                            src={data.profilePicture}
                                            alt={`@${data.username} profile`}
                                            w="full"
                                            h="full"
                                            objectFit="cover"
                                        />
                                    ) : (
                                        <Text fontSize="2xl" fontWeight="bold" color="gray.300">
                                            {(data.username || '').charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </Circle>
                            </Box>

                            {/* Username and Title - spaced for overlaid profile pic */}
                            <VStack gap="1" pt="16">
                                <Heading fontSize="3xl" fontWeight="bold" color="white">
                                    @{data.username}
                                </Heading>
                                {/* <Text color="gray.400" fontSize="lg">
                                    Signal to Noise Analysis
                                </Text> */}
                            </VStack>
                        </VStack>

                        {/* Status Badges */}
                        {/* <HStack gap="3" wrap="wrap" justify="center">
                            {data.fromCache && (
                                <Badge colorScheme="blue" fontSize="sm" px="3" py="1">
                                    Cached
                                </Badge>
                            )}
                            {data.testMode && (
                                <Badge colorScheme="purple" fontSize="sm" px="3" py="1">
                                    Test Mode
                                </Badge>
                            )}
                        </HStack> */}

                        {/* Signal Score */}
                        <VStack gap="2">
                            <Text color="gray.300" fontSize="lg" fontWeight="medium">
                                Signal to Noise Ratio
                            </Text>
                            <Text
                                fontSize="6xl"
                                fontWeight="black"
                                color={getSignalColor()}
                                lineHeight="1"
                            >
                                {(data.signalToNoiseRatio || 0).toFixed(3)}
                            </Text>
                            <Badge
                                colorScheme={(data.signalToNoiseRatio || 0) > 0.5 ? "green" : (data.signalToNoiseRatio || 0) > 0.2 ? "yellow" : "red"}
                                fontSize="md"
                                px="4"
                                py="2"
                                borderRadius="full"
                            >
                                {getSignalLabel()}
                            </Badge>
                        </VStack>

                        {/* Ranking */}
                        {data.rank && (
                            <VStack gap="2">
                                <Text color="gray.300" fontSize="md">
                                    Ranking
                                </Text>
                                <Text
                                    fontSize="2xl"
                                    fontWeight="bold"
                                    color={getRankColor(data.rank)}
                                >
                                    #{data.rank} out of {data.totalUsers}
                                </Text>
                            </VStack>
                        )}

                        {/* Action Buttons */}
                        <VStack gap="4" w="full" pt="4">
                            <Flex gap="4" w="full" justify="center" wrap="wrap">
                                <RemixLink to="/leaderboard">
                                    <Button colorScheme="blue" variant="solid" size="lg" minW="150px">
                                        View Leaderboard
                                    </Button>
                                </RemixLink>
                                <RemixLink to="/">
                                    <Button variant="outline" colorScheme="blue" size="lg" minW="150px">
                                        Analyze Another
                                    </Button>
                                </RemixLink>
                            </Flex>

                            {data.fromCache && (
                                <RemixLink to={`/signaltonoise/${data.username}?refresh=true`}>
                                    <Button variant="ghost" colorScheme="blue" size="sm">
                                        Refresh Analysis
                                    </Button>
                                </RemixLink>
                            )}
                        </VStack>
                    </VStack>
                </Box>

                {/* Footer */}
                <Text fontSize="sm" color="gray.500" textAlign="center" maxW="md">
                    Signal calculation considers engagement, length, and originality of tweets.
                    {/* {!data.fromCache && ` Based on ${data.totalTweets} recent tweets.`} */}
                </Text>
            </VStack>
        </Box >
    )
}
