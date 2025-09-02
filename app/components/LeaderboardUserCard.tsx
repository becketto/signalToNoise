import {
    Box,
    Circle,
    HStack,
    Image,
    Text,
    VStack
} from "@chakra-ui/react"
import { Link as RemixLink } from "react-router"
import { calculatePercentageScore, getSignalColor } from "../utils/scoreUtils"

interface LeaderboardUserCardProps {
    analysis: {
        id: string;
        username: string;
        displayName?: string;
        profilePicture?: string;
        signalToNoiseRatio: number;
    };
    rank: number;
    topScore: number;
}

export default function LeaderboardUserCard({ analysis, rank, topScore }: LeaderboardUserCardProps) {
    const percentageScore = calculatePercentageScore(analysis.signalToNoiseRatio, topScore);

    return (
        <RemixLink
            to={`/signaltonoise/${analysis.username}`}
            style={{ width: '100%' }}
        >
            <Box
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                w="full"
                p="4"
                boxShadow="0px 0px 50px -12px rgba(0, 0, 0, 0.5)"
                borderRadius="3xl"
                cursor="pointer"
            >
                <HStack justify="space-between" align="center">
                    <HStack gap="3">
                        <Text
                            fontSize="xl"
                            fontWeight="bold"
                            color={rank === 1 ? "yellow.400" : rank === 2 ? "gray.300" : rank === 3 ? "orange.400" : "gray.500"}
                            minW="10"
                        >
                            #{rank}
                        </Text>
                        <Circle size="40px" bg="gray.600" overflow="hidden">
                            {analysis.profilePicture ? (
                                <Image
                                    src={analysis.profilePicture}
                                    alt={`@${analysis.username} profile`}
                                    w="full"
                                    h="full"
                                    objectFit="cover"
                                />
                            ) : (
                                <Text fontSize="md" fontWeight="bold" color="gray.300">
                                    {(analysis.displayName || analysis.username).charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </Circle>
                        <VStack gap="0" align="start">
                            {analysis.displayName && (
                                <Text color="white" fontWeight="semibold" fontSize="md">
                                    {analysis.displayName}
                                </Text>
                            )}
                            <Text color="gray.400" fontSize="sm">
                                @{analysis.username}
                            </Text>
                        </VStack>
                    </HStack>

                    <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color={getSignalColor(percentageScore)}
                    >
                        {percentageScore}%
                    </Text>
                </HStack>
            </Box>
        </RemixLink>
    );
}
