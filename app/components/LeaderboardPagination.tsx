import {
    ButtonGroup,
    IconButton,
    Pagination
} from "@chakra-ui/react"
import { HiChevronLeft, HiChevronRight } from "react-icons/hi"
import { useRef, useEffect } from "react"

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface LeaderboardPaginationProps {
    pagination: PaginationData;
    onPageChange: (page: number) => void;
    showContext?: boolean;
}

export default function LeaderboardPagination({ pagination, onPageChange, showContext = false }: LeaderboardPaginationProps) {
    const paginationRef = useRef<HTMLDivElement>(null);
    const prevPageRef = useRef(pagination.page);

    useEffect(() => {
        // Only scroll if the page actually changed (not on initial render)
        if (prevPageRef.current !== pagination.page && paginationRef.current) {
            // Scroll to bottom immediately so pagination stays in same position
            window.scrollTo(0, document.body.scrollHeight);
        }
        prevPageRef.current = pagination.page;
    }, [pagination.page]);

    if (showContext || pagination.totalPages <= 1) {
        return null;
    }

    const handlePageChange = (details: { page: number }) => {
        onPageChange(details.page);
    };

    return (
        <div ref={paginationRef}>
            <Pagination.Root
                count={pagination.total}
                pageSize={pagination.limit}
                page={pagination.page}
                onPageChange={handlePageChange}
            >
                <ButtonGroup gap="4" size="md" variant="outline">
                    <Pagination.PrevTrigger asChild>
                        <IconButton
                            borderRadius="full"
                            h="40px"
                            w="40px"
                            color="blue.400"
                            borderColor="blue.400"
                            _hover={{
                                color: "blue.300",
                                borderColor: "blue.300",
                                bg: "blue.900"
                            }}
                            _disabled={{
                                color: "gray.500",
                                borderColor: "gray.600",
                                cursor: "not-allowed"
                            }}
                        >
                            <HiChevronLeft />
                        </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.PageText
                        color="blue.400"
                        fontSize="md"
                        fontWeight="medium"
                        px="4"
                        py="2"
                    />

                    <Pagination.NextTrigger asChild>
                        <IconButton
                            borderRadius="full"
                            h="40px"
                            w="40px"
                            color="blue.400"
                            borderColor="blue.400"
                            _hover={{
                                color: "blue.300",
                                borderColor: "blue.300",
                                bg: "blue.900"
                            }}
                            _disabled={{
                                color: "gray.500",
                                borderColor: "gray.600",
                                cursor: "not-allowed"
                            }}
                        >
                            <HiChevronRight />
                        </IconButton>
                    </Pagination.NextTrigger>
                </ButtonGroup>
            </Pagination.Root>
        </div>
    );
}
