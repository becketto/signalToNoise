import {
    Box,
    Circle,
    Heading,
    Image,
    Text,
    VStack
} from "@chakra-ui/react"
import { getSignalColor } from "../utils/scoreUtils"

interface ShareableCardProps {
    username: string
    displayName?: string | null
    profilePicture?: string | null
    coverPicture?: string | null
    percentageScore: number
    rank?: number | null
    totalUsers?: number | null
}

const getRankColor = (rank: number | null) => {
    if (!rank) return "gray.400";
    if (rank === 1) return "yellow.400";
    if (rank <= 3) return "orange.400";
    if (rank <= 10) return "green.400";
    return "blue.400";
};

export default function ShareableCard({
    username,
    displayName,
    profilePicture,
    coverPicture,
    percentageScore,
    rank,
    totalUsers
}: ShareableCardProps) {
    return (
        <Box
            w="800px"
            h="1000px"
            bg="gray.800"
            p="12"
            borderRadius="3xl"
            position="relative"
            overflow="hidden"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        >
            <VStack gap="6" h="full" justifyContent="space-between">
                {/* Profile Section with Banner */}
                <VStack gap="4" w="full">
                    {/* Banner and Profile Picture Container */}
                    <Box w="full" position="relative">
                        {/* Banner Image */}
                        <Box
                            w="full"
                            h="200px"
                            borderRadius="xl"
                            overflow="hidden"
                            bg="gray.700"
                            position="relative"
                        >
                            {coverPicture ? (
                                <Image
                                    src={coverPicture}
                                    alt={`@${username} banner`}
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
                        <Box
                            position="absolute"
                            bottom="-80px"
                            left="50%"
                            transform="translateX(-50%)"
                            zIndex="2"
                        >
                            <Circle
                                size="200px"
                                bg="gray.600"
                                border="8px solid"
                                borderColor="gray.800"
                                overflow="hidden"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {profilePicture ? (
                                    <Image
                                        src={profilePicture}
                                        alt={`@${username} profile`}
                                        w="full"
                                        h="full"
                                        objectFit="cover"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <Text
                                        fontSize="5xl"
                                        fontWeight="bold"
                                        color="gray.300"
                                    >
                                        {(displayName || username || '').charAt(0).toUpperCase()}
                                    </Text>
                                )}
                            </Circle>
                        </Box>
                    </Box>

                    {/* Username and Title - spaced for overlaid profile pic */}
                    <VStack gap="5" pt="24">
                        {displayName && (
                            <Heading fontSize="5xl" fontWeight="bold" color="white" textAlign="center" lineHeight="1.1">
                                {displayName}
                            </Heading>
                        )}
                        <Text
                            color={displayName ? "gray.400" : "white"}
                            fontSize={displayName ? "3xl" : "5xl"}
                            fontWeight={displayName ? "medium" : "bold"}
                            textAlign="center"
                            lineHeight="1.2"
                        >
                            @{username}
                        </Text>
                    </VStack>
                </VStack>

                {/* Main Content */}
                <VStack gap="12" flex="1" justifyContent="center">
                    {/* Slop Score */}
                    <VStack gap="4">
                        <Text color="gray.300" fontSize="4xl" fontWeight="medium">
                            Slop Score
                        </Text>
                        <Text
                            fontSize="9xl"
                            fontWeight="black"
                            color={getSignalColor(percentageScore)}
                            lineHeight="0.9"
                            textAlign="center"
                        >
                            {percentageScore}%
                        </Text>
                    </VStack>

                    {/* Ranking */}
                    {rank && totalUsers && (
                        <VStack gap="3">
                            <Text color="gray.300" fontSize="3xl" fontWeight="medium">
                                Ranking
                            </Text>
                            <Text
                                fontSize="4xl"
                                fontWeight="bold"
                                color={getRankColor(rank)}
                                textAlign="center"
                                lineHeight="1.2"
                            >
                                #{rank} out of {totalUsers}
                            </Text>
                        </VStack>
                    )}
                </VStack>

                {/* Footer Branding */}
                <VStack gap="2" pt="6">
                    <Text fontSize="2xl" color="gray.400" textAlign="center" fontWeight="medium">
                        becketto.com/slopscore
                    </Text>
                </VStack>
            </VStack>
        </Box>
    )
}
