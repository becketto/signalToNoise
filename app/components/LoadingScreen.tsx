import { Box, VStack, Text, Link, Spinner } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

// Signal wave animation
const signalWave = keyframes`
  0% { transform: scaleY(0.5); opacity: 0.7; }
  50% { transform: scaleY(1.5); opacity: 1; }
  100% { transform: scaleY(0.5); opacity: 0.7; }
`

// Pulse animation for the spinner
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`

export default function LoadingScreen() {
    return (
        <Box
            minH="100vh"
            bg="gray.900"
            color="white"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            p="8"
        >
            <VStack gap="8" textAlign="center" maxW="md">
                {/* Signal Wave Animation */}
                <Box position="relative" w="200px" h="80px">
                    {/* Signal bars */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                        <Box
                            key={index}
                            position="absolute"
                            left={`${index * 20 + 20}px`}
                            bottom="0"
                            w="8px"
                            h="60px"
                            bg="blue.400"
                            borderRadius="2px"
                            animation={`${signalWave} 1.5s ease-in-out infinite`}
                            style={{
                                animationDelay: `${index * 0.1}s`,
                            }}
                        />
                    ))}
                </Box>

                {/* Loading text */}
                <VStack gap="2">
                    <Text fontSize="2xl" fontWeight="bold" color="blue.400">
                        Analyzing Signal
                    </Text>
                    <Text fontSize="lg" color="gray.300">
                        Crunching the numbers...
                    </Text>
                </VStack>

                {/* Game-style tip */}
                <Box pt="8">
                    <Text fontSize="md" color="gray.400" textAlign="center">
                        While you're waiting, you should follow{" "}
                        <Link
                            href="https://x.com/ecombeckett"
                            target="_blank"
                            rel="noopener noreferrer"
                            color="red.400"
                            fontWeight="semibold"
                            _hover={{
                                color: "red.300",
                                textDecoration: "underline"
                            }}
                            transition="all 0.2s"
                        >
                            @ecombeckett
                        </Link>
                        {" "}because he made this and it's cool
                    </Text>
                </Box>
            </VStack>
        </Box>
    )
}
