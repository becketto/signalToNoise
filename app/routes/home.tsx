import { Box, Button, Heading, Input, HStack, VStack, Text, Link } from "@chakra-ui/react"
import { Form, useNavigate } from "react-router"

export function meta() {
  return [
    { title: "Signal to Noise" },
    { name: "description", content: "Get your signal to noise ratio" },
  ]
}

export default function Home() {
  const navigate = useNavigate();

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
      <VStack gap="8" w="full" maxW="md">
        <Heading
          fontSize="3xl"
          fontWeight="medium"
          textAlign="center"
          mb="8"
        >
          Get your signal to noise ratio
        </Heading>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <HStack w="full" gap="2">
            <Text fontSize="lg" color="gray.300">@</Text>
            <Input
              name="username"
              placeholder="Username"
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              _hover={{ borderColor: "gray.600" }}
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182CE" }}
              color="white"
              _placeholder={{ color: "gray.400" }}
              flex="1"
              required
            />
            <Button
              type="submit"
              bg="blue.600"
              color="white"
              _hover={{ bg: "blue.700" }}
              _active={{ bg: "blue.800" }}
              px="6"
            >
              Analyze
            </Button>
          </HStack>
        </form>

        <Box position="absolute" bottom="8" textAlign="center">
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
