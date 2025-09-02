import { Box, Heading, VStack, Text, Code, HStack } from "@chakra-ui/react"

export function meta() {
    return [
        { title: "Slop Score - Calculation Logic" },
    ]
}

export default function CalcLogic() {
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
            <VStack gap="8" w="full" maxW="4xl">
                {/* Main Card */}
                <Box
                    bg="gray.800"
                    borderColor="gray.700"
                    borderWidth="1px"
                    w="full"
                    boxShadow="0px 0px 50px -12px rgba(0, 0, 0, 0.5)"
                    borderRadius="3xl"
                    p="8"
                >
                    <VStack gap="6" textAlign="left" alignItems="start">
                        {/* Header */}
                        <Heading
                            fontSize="4xl"
                            fontWeight="medium"
                            color="white"
                            textAlign="center"
                            w="full"
                        >
                            Calculation Logic
                        </Heading>

                        {/* Core Formula */}
                        <VStack gap="4" w="full" alignItems="start">
                            <Text fontSize="xl" fontWeight="semibold" color="blue.400">
                                Score = (∑ TweetScore) / TweetCount
                            </Text>

                            {/* Weights */}
                            <Box bg="gray.700" p="4" borderRadius="lg" w="full">
                                <Text fontSize="lg" fontWeight="semibold" mb="3">Weights:</Text>
                                <VStack gap="1" alignItems="start" fontSize="sm">
                                    <HStack><Text color="gray.200">Likes:</Text><Code bg="gray.600" p="1" borderRadius="sm">×200</Code></HStack>
                                    <HStack><Text color="gray.200">Replies:</Text><Code bg="gray.600" p="1" borderRadius="sm">×100</Code></HStack>
                                    <HStack><Text color="gray.200">Bookmarks:</Text><Code bg="gray.600" p="1" borderRadius="sm">0-150 pts</Code></HStack>
                                    <HStack><Text color="gray.200">Retweets:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-100</Code></HStack>
                                    <HStack><Text color="gray.200">Hashtags:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-200 each</Code></HStack>
                                    <HStack><Text color="gray.200">Em dashes:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-200 each</Code></HStack>
                                </VStack>
                            </Box>

                            <Box bg="gray.700" p="4" borderRadius="lg" w="full">
                                <Text fontSize="lg" fontWeight="semibold" mb="3">Engagement Calculation:</Text>
                                <VStack gap="2" alignItems="start">
                                    <Code bg="gray.600" p="2" borderRadius="md" fontSize="sm">
                                        L(likes, followers) × 200 + R(replies, followers) × 100 + B(bookmarks, followers)
                                    </Code>
                                    <Text fontSize="sm" color="gray.200">Retweets skip engagement calculation and get -100 penalty</Text>
                                </VStack>
                            </Box>

                            <Box bg="gray.700" p="4" borderRadius="lg" w="full">
                                <Text fontSize="lg" fontWeight="semibold" mb="3">Content Scoring:</Text>
                                <VStack gap="1" alignItems="start" fontSize="sm">
                                    <Text fontSize="sm" fontWeight="semibold" color="green.300" mb="1">Bonuses:</Text>
                                    <HStack><Text color="gray.200">Text + Image:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="green.300">+50</Code></HStack>
                                    <HStack><Text color="gray.200">Text + Image + Quote:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="green.300">+75</Code></HStack>
                                    <Text fontSize="sm" fontWeight="semibold" color="red.300" mt="2" mb="1">Penalties:</Text>
                                    <HStack><Text color="gray.200">{"< 5 words:"}</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-100</Code></HStack>
                                    <HStack><Text color="gray.200">Per hashtag:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-200</Code></HStack>
                                    <HStack><Text color="gray.200">External link:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-50</Code></HStack>
                                    <HStack><Text color="gray.200">Quote tweet:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-50</Code></HStack>
                                    <HStack><Text color="gray.200">Per em dash:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">-200</Code></HStack>
                                    <HStack><Text color="gray.200">Complexity:</Text><Code bg="gray.600" p="1" borderRadius="sm" color="red.300">C(text)</Code></HStack>
                                </VStack>
                            </Box>

                            <Box bg="gray.700" p="4" borderRadius="lg" w="full">
                                <Text fontSize="lg" fontWeight="semibold" mb="3">Engagement Functions:</Text>
                                <VStack gap="2" alignItems="start" fontSize="sm">
                                    <Text color="gray.200">L(likes, followers) = Power-law engagement model with sigmoid scoring</Text>
                                    <Text color="gray.200">R(replies, followers) = Similar model, higher baseline (replies rarer)</Text>
                                    <Text color="gray.200">B(bookmarks, followers) = Bookmark-specific power-law with 2x multiplier</Text>
                                </VStack>
                            </Box>

                            <Box bg="gray.700" p="4" borderRadius="lg" w="full">
                                <Text fontSize="lg" fontWeight="semibold" mb="3">Normalization:</Text>
                                <VStack gap="1" alignItems="start" fontSize="sm">
                                    <HStack><Text color="gray.200">{"≤ -200:"}</Text><Code bg="gray.600" p="1" borderRadius="sm">max(0, 10 + (score + 200)/50)</Code></HStack>
                                    <HStack><Text color="gray.200">{"≤ 0:"}</Text><Code bg="gray.600" p="1" borderRadius="sm">max(0, 20 + score/10)</Code></HStack>
                                    <HStack><Text color="gray.200">{"≤ 200:"}</Text><Code bg="gray.600" p="1" borderRadius="sm">20 + (score/200) × 30</Code></HStack>
                                    <HStack><Text color="gray.200">{"≤ 500:"}</Text><Code bg="gray.600" p="1" borderRadius="sm">50 + ((score-200)/300) × 30</Code></HStack>
                                    <HStack><Text color="gray.200">{"> 500:"}</Text><Code bg="gray.600" p="1" borderRadius="sm">80 + min(20, (score-500)/100)</Code></HStack>
                                </VStack>
                            </Box>
                        </VStack>
                    </VStack>
                </Box>

                {/* Footer */}
                <Text fontSize="sm" color="gray.500" textAlign="center" maxW="md">
                    Final score normalized to 0-100 scale
                </Text>
            </VStack>
        </Box>
    )
}
