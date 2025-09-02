import {
    Box,
    Button,
    Heading,
    Link,
    Text,
    VStack
} from "@chakra-ui/react"
import { useLoaderData, Link as RemixLink, useNavigate, useSearchParams } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import prisma from "../db.server"
import LeaderboardSearch from "../components/LeaderboardSearch"
import LeaderboardUserCard from "../components/LeaderboardUserCard"
import LeaderboardPagination from "../components/LeaderboardPagination"

export function meta() {
    return [
        { title: "Signal to Noise - Leaderboard" },
        { name: "description", content: "Signal to noise ratio leaderboard - see who has the highest signal" },
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search')?.trim() || '';
        const sortBy = url.searchParams.get('sort') || 'signal'; // 'signal' or 'slop'

        const skip = (page - 1) * limit;

        // Determine sort order - signal: desc (high is good), slop: asc (low is good, high slop is bad)
        const orderBy = sortBy === 'slop'
            ? { signalToNoiseRatio: 'asc' as const }
            : { signalToNoiseRatio: 'desc' as const };

        // Build where clause for search
        const where = search ? {
            OR: [
                { username: { contains: search, mode: 'insensitive' as const } },
                { displayName: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

        // If search is provided, find the user's position and show context around them
        if (search) {
            // First, get all analyses ordered by score to find the searched user's position
            const allAnalyses = await prisma.analysis.findMany({
                orderBy,
                select: { username: true, displayName: true }
            });

            const searchedUserIndex = allAnalyses.findIndex(analysis =>
                analysis.username.toLowerCase().includes(search.toLowerCase()) ||
                (analysis.displayName && analysis.displayName.toLowerCase().includes(search.toLowerCase()))
            );

            if (searchedUserIndex !== -1) {
                // Show 5 people above and 5 below the found user (total 10)
                const contextStart = Math.max(0, searchedUserIndex - 5);
                const contextLimit = 10;

                const analyses = await prisma.analysis.findMany({
                    orderBy,
                    skip: contextStart,
                    take: contextLimit,
                    select: {
                        id: true,
                        username: true,
                        displayName: true,
                        profilePicture: true,
                        signalToNoiseRatio: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });

                const total = await prisma.analysis.count();

                // Get the global top score for percentage calculations
                const topScoreAnalysis = await prisma.analysis.findFirst({
                    orderBy: { signalToNoiseRatio: 'desc' },
                    select: { signalToNoiseRatio: true }
                });

                return {
                    success: true,
                    analyses,
                    pagination: {
                        page: Math.floor(contextStart / limit) + 1,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                        hasNext: contextStart + contextLimit < total,
                        hasPrev: contextStart > 0
                    },
                    searchContext: {
                        userPosition: searchedUserIndex + 1,
                        showingContext: true,
                        totalInSearch: allAnalyses.length
                    },
                    globalTopScore: topScoreAnalysis?.signalToNoiseRatio || 0,
                    sortBy
                };
            }
        }

        // Regular pagination
        const analyses = await prisma.analysis.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            select: {
                id: true,
                username: true,
                displayName: true,
                profilePicture: true,
                signalToNoiseRatio: true,
                createdAt: true,
                updatedAt: true
            }
        });

        const total = await prisma.analysis.count({ where });
        const totalPages = Math.ceil(total / limit);

        // Get the global top score for percentage calculations
        const topScoreAnalysis = await prisma.analysis.findFirst({
            orderBy: { signalToNoiseRatio: 'desc' },
            select: { signalToNoiseRatio: true }
        });

        return {
            success: true,
            analyses,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            globalTopScore: topScoreAnalysis?.signalToNoiseRatio || 0,
            sortBy
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
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Use the global top score for percentage calculation
    const topScore = data.globalTopScore || 0;

    const handleSearch = (searchTerm: string) => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        }
        params.set('page', '1'); // Reset to first page on search
        navigate(`/leaderboard?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        navigate(`/leaderboard?${params.toString()}`);
    };

    const handleClearSearch = () => {
        navigate('/leaderboard');
    };

    const handleSortChange = (newSort: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', newSort);
        params.set('page', '1'); // Reset to first page on sort change
        navigate(`/leaderboard?${params.toString()}`);
    };

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
                        Slop Score Leaderboard
                    </Heading>
                    <Text fontSize="lg" color="gray.300">
                        Rankings are relative to the person with the lowest slop score
                    </Text>
                    <RemixLink to="/">
                        <Link color="blue.400" textDecoration="underline">
                            Analyze Your Account
                        </Link>
                    </RemixLink>
                </VStack>

                {/* Search with Sort Toggle */}
                <VStack gap="3" w="full" maxW="4xl">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        {/* Sort Toggle Button */}
                        <Button
                            onClick={() => handleSortChange(data.sortBy === 'slop' ? 'signal' : 'slop')}
                            bg="gray.700"
                            color="white"
                            _hover={{ bg: "gray.600" }}
                            _active={{ bg: "gray.800" }}
                            borderRadius="full"
                            w="48px"
                            h="48px"
                            minW="48px"
                            p="0"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            border="1px solid"
                            borderColor="gray.600"
                        >
                            {data.sortBy === 'slop' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 14l5-5 5 5z" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 10l5 5 5-5z" />
                                </svg>
                            )}
                        </Button>

                        {/* Search Component */}
                        <div style={{ flex: 1 }}>
                            <LeaderboardSearch
                                initialValue={searchParams.get('search') || ''}
                                onSearch={handleSearch}
                                onClear={handleClearSearch}
                            />
                        </div>
                    </div>
                </VStack>

                {/* Search Context Info */}
                {data.searchContext?.showingContext && (
                    <Box
                        bg="blue.900"
                        borderColor="blue.600"
                        borderWidth="1px"
                        borderRadius="lg"
                        p="3"
                        textAlign="center"
                    >
                        <Text fontSize="sm" color="blue.200">
                            Showing ranks around position #{data.searchContext.userPosition}
                        </Text>
                    </Box>
                )}



                {/* Leaderboard */}
                <VStack gap="3" w="full">
                    {!data.analyses || data.analyses.length === 0 ? (
                        <Box
                            bg="gray.800"
                            borderColor="gray.700"
                            borderWidth="1px"
                            boxShadow="0px 0px 50px -12px rgba(0, 0, 0, 0.5)"
                            borderRadius="3xl"
                            p="8"
                            textAlign="center"
                            w="full"
                        >
                            <Text color="gray.400">No analyses yet. Be the first to analyze your account!</Text>
                        </Box>
                    ) : (
                        data.analyses.map((analysis: any, index: number) => {
                            // Calculate the actual rank based on pagination or search context
                            let actualRank;
                            if (data.searchContext?.showingContext) {
                                // Context around searched user
                                actualRank = data.searchContext.userPosition - 5 + index;
                            } else {
                                // Regular pagination
                                actualRank = ((data.pagination?.page || 1) - 1) * (data.pagination?.limit || 10) + index + 1;
                            }

                            // When sorting by slop (ascending), we need to invert the rank to show worst first
                            if (data.sortBy === 'slop') {
                                const totalCount = data.searchContext?.totalInSearch || data.pagination?.total || 0;
                                if (data.searchContext?.showingContext) {
                                    // For search context, calculate inverted rank from the user's actual position
                                    const contextStart = Math.max(0, data.searchContext.userPosition - 6); // -6 because userPosition is 1-based
                                    actualRank = totalCount - (contextStart + index);
                                } else {
                                    // For regular pagination, invert the rank
                                    const baseIndex = ((data.pagination?.page || 1) - 1) * (data.pagination?.limit || 10) + index;
                                    actualRank = totalCount - baseIndex;
                                }
                            }

                            return (
                                <LeaderboardUserCard
                                    key={analysis.id}
                                    analysis={analysis}
                                    rank={actualRank}
                                    topScore={topScore}
                                />
                            );
                        })
                    )}
                </VStack>

                {/* Pagination Controls */}
                {data.pagination && (
                    <LeaderboardPagination
                        pagination={data.pagination}
                        onPageChange={handlePageChange}
                        showContext={data.searchContext?.showingContext}
                    />
                )}

                {/* Back to Top 10 button when showing search context */}
                {data.searchContext?.showingContext && (
                    <Button
                        onClick={() => navigate('/leaderboard')}
                        bg="white"
                        color="black"
                        _hover={{ bg: "gray.100" }}
                        _active={{ bg: "gray.200" }}
                        borderRadius="full"
                        h="40px"
                        px="6"
                        fontSize="md"
                        fontWeight="medium"
                    >
                        Back to Top 10
                    </Button>
                )}
            </VStack>
        </Box>
    )
}
