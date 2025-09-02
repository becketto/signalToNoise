import {
    Box,
    Button,
    HStack,
    Input
} from "@chakra-ui/react"
import { useState } from "react"

interface LeaderboardSearchProps {
    initialValue?: string;
    onSearch: (searchTerm: string) => void;
    onClear: () => void;
}

export default function LeaderboardSearch({ initialValue = '', onSearch, onClear }: LeaderboardSearchProps) {
    const [searchValue, setSearchValue] = useState(initialValue);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSearch(searchValue);
        }
    };

    const handleClear = () => {
        setSearchValue('');
        onClear();
    };

    return (
        <Box w="full" maxW="4xl">
            <HStack gap="3" w="full">
                <Input
                    placeholder="Search by username or display name..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={handleKeyPress}
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
                    h="48px"
                    fontSize="md"
                    flex="1"
                />
                <Button
                    onClick={() => onSearch(searchValue)}
                    bg="white"
                    color="black"
                    _hover={{ bg: "gray.100" }}
                    _active={{ bg: "gray.200" }}
                    borderRadius="full"
                    h="48px"
                    px="6"
                    fontSize="md"
                    fontWeight="medium"
                    minW="24"
                >
                    Search
                </Button>
                <Button
                    onClick={handleClear}
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="full"
                    h="48px"
                    px="6"
                    fontSize="md"
                    fontWeight="medium"
                    color="blue.400"
                    borderColor="blue.400"
                    _hover={{
                        color: "blue.300",
                        borderColor: "blue.300",
                        bg: "blue.900"
                    }}
                    minW="20"
                >
                    Clear
                </Button>
            </HStack>
        </Box>
    );
}
