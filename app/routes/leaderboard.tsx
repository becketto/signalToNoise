import {
    Badge,
    Box,
    Circle,
    Heading,
    HStack,
    Image,
    Link,
    Text,
    VStack
} from "@chakra-ui/react"
import { useLoaderData, Link as RemixLink } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import prisma from "../db.server"

export function meta() {
    return [
        { title: "Signal to Noise - Leaderboard" },
        { name: "description", content: "Signal to noise ratio leaderboard - see who has the highest signal" },
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const analyses = await prisma.analysis.findMany({
            orderBy: {
                signalToNoiseRatio: 'desc'
            }
        });

        return {
            success: true,
            analyses
        };
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return {
            success: false,
            error: "Failed to load leaderboard"
        };
    }
}

export default function Leaderboard() {
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
                        <Link color="blue.400">Go Back</Link>
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
            <VStack gap="8" w="full" maxW="4xl" mx="auto">
                {/* Header */}
                <VStack gap="4" textAlign="center">
                    <Heading fontSize="4xl" fontWeight="medium">
                        Signal to Noise Leaderboard
                    </Heading>
                    <Text fontSize="lg" color="gray.300">
                        Ranked by signal to noise ratio
                    </Text>
                    <RemixLink to="/">
                        <Link color="blue.400" textDecoration="underline">
                            Analyze Your Account
                        </Link>
                    </RemixLink>
                </VStack>

                {/* Leaderboard */}
                <VStack gap="4" w="full">
                    {!data.analyses || data.analyses.length === 0 ? (
                        <Box bg="gray.800" p="8" borderRadius="lg" textAlign="center" w="full">
                            <Text color="gray.400">No analyses yet. Be the first to analyze your account!</Text>
                        </Box>
                    ) : (
                        data.analyses.map((analysis: any, index: number) => (
                            <Box
                                key={analysis.id}
                                bg="gray.800"
                                border="1px solid"
                                borderColor="gray.700"
                                w="full"
                                p="6"
                                borderRadius="lg"
                                transition="all 0.2s"
                                _hover={{ borderColor: "gray.600", transform: "translateY(-2px)" }}
                            >
                                <HStack justify="space-between" align="center">
                                    <HStack gap="4">
                                        <Text
                                            fontSize="2xl"
                                            fontWeight="bold"
                                            color={index === 0 ? "yellow.400" : index === 1 ? "gray.300" : index === 2 ? "orange.400" : "gray.500"}
                                            minW="12"
                                        >
                                            #{index + 1}
                                        </Text>
                                        <Circle size="48px" bg="gray.600" overflow="hidden">
                                            {analysis.profilePicture ? (
                                                <Image
                                                    src={analysis.profilePicture}
                                                    alt={`@${analysis.username} profile`}
                                                    w="full"
                                                    h="full"
                                                    objectFit="cover"
                                                />
                                            ) : (
                                                <Text fontSize="lg" fontWeight="bold" color="gray.300">
                                                    {analysis.username.charAt(0).toUpperCase()}
                                                </Text>
                                            )}
                                        </Circle>
                                        <VStack align="start" gap="1">
                                            <RemixLink to={`/signaltonoise/${analysis.username}`}>
                                                <Link color="white" fontWeight="semibold" _hover={{ color: "blue.400" }}>
                                                    @{analysis.username}
                                                </Link>
                                            </RemixLink>
                                            <Text fontSize="sm" color="gray.400">
                                                Analyzed {new Date(analysis.createdAt).toLocaleDateString()}
                                            </Text>
                                        </VStack>
                                    </HStack>

                                    <VStack align="end" gap="1">
                                        <Text
                                            fontSize="2xl"
                                            fontWeight="bold"
                                            color={analysis.signalToNoiseRatio > 0.5 ? "green.400" : analysis.signalToNoiseRatio > 0.2 ? "yellow.400" : "red.400"}
                                        >
                                            {analysis.signalToNoiseRatio.toFixed(3)}
                                        </Text>
                                        <Badge
                                            colorScheme={analysis.signalToNoiseRatio > 0.5 ? "green" : analysis.signalToNoiseRatio > 0.2 ? "yellow" : "red"}
                                            fontSize="xs"
                                        >
                                            {analysis.signalToNoiseRatio > 0.5 ? "High Signal" : analysis.signalToNoiseRatio > 0.2 ? "Moderate" : "Low Signal"}
                                        </Badge>
                                    </VStack>
                                </HStack>
                            </Box>
                        ))
                    )}
                </VStack>

                {/* Footer */}
                <Box textAlign="center" pt="8">
                    <Text fontSize="sm" color="gray.400">
                        Signal calculation considers engagement, length, and originality of tweets
                    </Text>
                </Box>
            </VStack>
        </Box>
    )
}
