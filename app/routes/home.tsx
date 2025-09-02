import { Box, Button, Heading, Input, HStack, VStack, Text, Link } from "@chakra-ui/react"
import { Form, useNavigate, useNavigation, Link as RemixLink } from "react-router"
import LoadingScreen from "../components/LoadingScreen"

export function meta() {
  return [
    { title: "Slop Score" },
  ]
}

export default function Home() {
  const navigate = useNavigate();
  const navigation = useNavigation();

  // Show loading screen when navigating to analysis
  if (navigation.state === "loading" && navigation.location?.pathname.includes("/signaltonoise/")) {
    return <LoadingScreen />;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;

    if (username) {
      navigate(`/signaltonoise/${username}`);
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
          bg="gray.800"
          borderColor="gray.700"
          borderWidth="1px"
          w="full"
          boxShadow="0px 0px 50px -12px rgba(0, 0, 0, 0.5)"
          borderRadius="3xl"
          p="8"
        >
          <VStack gap="6" textAlign="center">
            {/* Header */}
            <VStack gap="3">
              <Heading
                fontSize="4xl"
                fontWeight="medium"
                color="white"
              >
                Get Your Slop Score
              </Heading>
            </VStack>

            {/* Input Form */}
            <Box w="full" maxW="400px">
              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <HStack w="full" gap="2">
                  <Text fontSize="lg" color="gray.300" minW="6">@</Text>
                  <Input
                    name="username"
                    placeholder="username"
                    bg="gray.700"
                    border="1px solid"
                    borderColor="gray.600"
                    borderRadius="full"
                    _hover={{ borderColor: "gray.500" }}
                    _focus={{
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px #3182CE",
                      bg: "gray.700"
                    }}
                    color="white"
                    _placeholder={{ color: "gray.400" }}
                    flex="1"
                    h="48px"
                    fontSize="md"
                    required
                  />
                  <Button
                    type="submit"
                    bg="white"
                    color="black"
                    _hover={{ bg: "gray.100" }}
                    _active={{ bg: "gray.200" }}
                    borderRadius="full"
                    h="48px"
                    px="6"
                    fontSize="md"
                    fontWeight="medium"
                  >
                    Analyze
                  </Button>
                </HStack>
              </form>
            </Box>

            {/* Navigation Link */}
            <RemixLink to="/leaderboard">
              <Link color="blue.400" textDecoration="underline" fontSize="md">
                View Leaderboard
              </Link>
            </RemixLink>
          </VStack>
        </Box>

        {/* Footer */}
        <Text fontSize="sm" color="gray.500" textAlign="center" maxW="md">
          Signal calculation considers engagement, length, and originality of tweets.
        </Text>

        {/* Creator Credit */}
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.400">
            Created by{" "}
            <Link
              href="https://x.com/ecombeckett"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.400"
              _hover={{ color: "blue.300", textDecoration: "underline" }}
            >
              @ecombeckett
            </Link>
          </Text>
        </Box>
      </VStack>
    </Box>
  )
}
