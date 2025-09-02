"use client"

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
import { useLoaderData, Link as RemixLink, useNavigate, useParams, useNavigation } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { getTweets } from "../services/getTweets"
import { useRef, useEffect } from "react"
import html2canvas from "html2canvas"
import { toaster } from "../components/ui/toaster"
import { calculatePercentageScore, getSignalColor, getSignalLabel, getSignalColorScheme } from "../utils/scoreUtils"
import LoadingScreen from "../components/LoadingScreen"

export function meta({ params }: { params: { username: string } }) {
    return [
        { title: `Slop Score - @${params.username}` },
        { name: "description", content: `Slop score analysis for @${params.username}` },
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
    const navigate = useNavigate();
    const params = useParams();
    const navigation = useNavigation();
    const cardRef = useRef<HTMLDivElement>(null);
    const shareableCardRef = useRef<HTMLDivElement>(null);

    // Show loading screen when navigating to this route (when loader is running)
    if (navigation.state === "loading") {
        return <LoadingScreen />;
    }

    // Calculate percentage score on frontend
    const percentageScore = calculatePercentageScore(data.signalToNoiseRatio || 0, data.topScore || 0);

    // Handle refresh cooldown error
    useEffect(() => {
        if (!data.success && data.error === "refresh_cooldown") {
            toaster.create({
                title: "Please wait",
                description: `You can refresh analysis again in ${data.remainingMinutes} more minutes.`,
                type: "warning",
                duration: 5000,
            });

            // Redirect back to the user page without refresh parameter
            navigate(`/signaltonoise/${params.username}`, { replace: true });
        }
    }, [data, navigate, params.username]);

    if (!data.success) {
        // Handle refresh cooldown error specifically
        if (data.error === "refresh_cooldown") {
            return null; // Will redirect via useEffect
        }

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



    const copyCardAsImage = async () => {
        if (!shareableCardRef.current) return;

        try {
            // Wait for fonts and images to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            const canvas = await html2canvas(shareableCardRef.current, {
                backgroundColor: '#1a202c', // gray.800 background
                scale: 2, // Higher quality but not too high to avoid memory issues
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                imageTimeout: 15000,
                removeContainer: true,
                logging: false,
                width: shareableCardRef.current.offsetWidth,
                height: shareableCardRef.current.offsetHeight,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0
            });

            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        toaster.create({
                            title: "Copied to clipboard!",
                            description: "Your slop score card has been copied as an image.",
                            type: "success",
                            duration: 3000,
                        });
                    } catch (err) {
                        console.error('Failed to copy image to clipboard:', err);
                        toaster.create({
                            title: "Copy failed",
                            description: "Could not copy image to clipboard. Try using a different browser.",
                            type: "error",
                            duration: 5000,
                        });
                    }
                }
            }, 'image/png');
        } catch (error) {
            console.error('Failed to capture card as image:', error);
            toaster.create({
                title: "Capture failed",
                description: "Could not capture the card as an image.",
                type: "error",
                duration: 5000,
            });
        }
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
                    ref={cardRef}
                    bg="gray.800"
                    borderColor="gray.700"
                    borderWidth="1px"
                    w="full"
                    boxShadow="0px 0px 50px -12px rgba(0, 0, 0, 0.5)"
                    borderRadius="3xl"
                    p="6"
                >
                    {/* Shareable Card Content (without buttons) */}
                    <Box
                        ref={shareableCardRef}
                        bg="gray.800"
                        w="full"
                        p="6"
                        borderRadius="3xl"
                    >
                        <VStack gap="4" textAlign="center">
                            {/* Profile Section with Banner */}
                            <VStack gap="3" w="full">
                                {/* Banner and Profile Picture Container */}
                                <Box w="full" position="relative">
                                    {/* Banner Image */}
                                    <Box
                                        w="full"
                                        aspectRatio="3/1"
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
                                                crossOrigin="anonymous"
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
                                                crossOrigin="anonymous"
                                                onError={(e) => {
                                                    // Fallback to letter if image fails to load
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        <Text
                                            fontSize="2xl"
                                            fontWeight="bold"
                                            color="gray.300"
                                            display={data.profilePicture ? "none" : "block"}
                                        >
                                            {(data.displayName || data.username || '').charAt(0).toUpperCase()}
                                        </Text>
                                    </Circle>
                                </Box>

                                {/* Username and Title - spaced for overlaid profile pic */}
                                <VStack gap="1" pt="12">
                                    {data.displayName && (
                                        <Heading fontSize="3xl" fontWeight="bold" color="white">
                                            {data.displayName}
                                        </Heading>
                                    )}
                                    <Text color={data.displayName ? "gray.400" : "white"} fontSize={data.displayName ? "lg" : "3xl"} fontWeight={data.displayName ? "medium" : "bold"}>
                                        @{data.username}
                                    </Text>
                                </VStack>
                            </VStack>

                            {/* Slop Score */}
                            <VStack gap="1">
                                <Text color="gray.300" fontSize="lg" fontWeight="medium">
                                    Slop Score
                                </Text>
                                <Text
                                    fontSize="6xl"
                                    fontWeight="black"
                                    color={getSignalColor(percentageScore)}
                                    lineHeight="1"
                                >
                                    {percentageScore}%
                                </Text>
                                {/* <Badge
                                    colorScheme={getSignalColorScheme(percentageScore)}
                                    fontSize="md"
                                    px="4"
                                    py="2"
                                    borderRadius="full"
                                >
                                    {getSignalLabel(percentageScore)}
                                </Badge> */}
                            </VStack>

                            {/* Ranking */}
                            {data.rank && (
                                <VStack gap="1">
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

                            {/* Add Signal to Noise branding to shareable card */}
                            <Text fontSize="sm" color="gray.400" textAlign="center" pt="2">
                                becketto.com/slopscore
                            </Text>
                        </VStack>
                    </Box>

                    {/* Action Buttons - Outside shareable card */}
                    <VStack gap="3" w="full" pt="4">
                        {/* Desktop: 2x2 Grid, Mobile: 1x4 Stack */}
                        <Box w="full" maxW="400px">
                            <VStack gap="3" display={{ base: "flex", md: "none" }}>
                                {/* Mobile: Vertical Stack */}
                                <RemixLink to="/leaderboard" style={{ width: '100%' }}>
                                    <Button
                                        colorScheme="blue"
                                        variant="solid"
                                        size="md"
                                        borderRadius="full"
                                        w="full"
                                        h="40px"
                                    >
                                        View Leaderboard
                                    </Button>
                                </RemixLink>

                                <RemixLink to="/" style={{ width: '100%' }}>
                                    <Button
                                        variant="outline"
                                        colorScheme="blue"
                                        size="md"
                                        borderRadius="full"
                                        w="full"
                                        h="40px"
                                        color="blue.400"
                                        borderColor="blue.400"
                                        _hover={{
                                            color: "blue.300",
                                            borderColor: "blue.300",
                                            bg: "blue.900"
                                        }}
                                    >
                                        Analyze Another
                                    </Button>
                                </RemixLink>

                                <Button
                                    onClick={copyCardAsImage}
                                    colorScheme="green"
                                    variant="solid"
                                    size="md"
                                    borderRadius="full"
                                    w="full"
                                    h="40px"
                                >
                                    Copy as Image
                                </Button>

                                <RemixLink to={`/signaltonoise/${data.username}?refresh=true`} style={{ width: '100%' }}>
                                    <Button
                                        variant="outline"
                                        colorScheme="gray"
                                        size="md"
                                        borderRadius="full"
                                        w="full"
                                        h="40px"
                                        color="gray.400"
                                        borderColor="gray.600"
                                        _hover={{
                                            color: "gray.300",
                                            borderColor: "gray.500",
                                            bg: "gray.800"
                                        }}
                                    >
                                        Refresh Analysis
                                    </Button>
                                </RemixLink>
                            </VStack>

                            {/* Desktop: 2x2 Grid */}
                            <VStack gap="3" display={{ base: "none", md: "flex" }} w="full">
                                {/* First Row */}
                                <HStack gap="3" w="full">
                                    <Box w="calc(50% - 6px)">
                                        <RemixLink to="/leaderboard" style={{ width: '100%', display: 'block' }}>
                                            <Button
                                                colorScheme="blue"
                                                variant="solid"
                                                size="md"
                                                borderRadius="full"
                                                w="full"
                                                h="40px"
                                            >
                                                Leaderboard
                                            </Button>
                                        </RemixLink>
                                    </Box>

                                    <Box w="calc(50% - 6px)">
                                        <RemixLink to="/" style={{ width: '100%', display: 'block' }}>
                                            <Button
                                                variant="outline"
                                                colorScheme="blue"
                                                size="md"
                                                borderRadius="full"
                                                w="full"
                                                h="40px"
                                                color="blue.400"
                                                borderColor="blue.400"
                                                _hover={{
                                                    color: "blue.300",
                                                    borderColor: "blue.300",
                                                    bg: "blue.900"
                                                }}
                                            >
                                                Analyze Another
                                            </Button>
                                        </RemixLink>
                                    </Box>
                                </HStack>

                                {/* Second Row */}
                                <HStack gap="3" w="full">
                                    <Box w="calc(50% - 6px)">
                                        <Button
                                            onClick={copyCardAsImage}
                                            colorScheme="green"
                                            variant="solid"
                                            size="md"
                                            borderRadius="full"
                                            w="full"
                                            h="40px"
                                        >
                                            Copy as Image
                                        </Button>
                                    </Box>

                                    <Box w="calc(50% - 6px)">
                                        <RemixLink to={`/signaltonoise/${data.username}?refresh=true`} style={{ width: '100%', display: 'block' }}>
                                            <Button
                                                variant="outline"
                                                colorScheme="gray"
                                                size="md"
                                                borderRadius="full"
                                                w="full"
                                                h="40px"
                                                color="gray.400"
                                                borderColor="gray.600"
                                                _hover={{
                                                    color: "gray.300",
                                                    borderColor: "gray.500",
                                                    bg: "gray.800"
                                                }}
                                            >
                                                Refresh
                                            </Button>
                                        </RemixLink>
                                    </Box>
                                </HStack>
                            </VStack>
                        </Box>
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
