import { useState } from "react";
import {
  ChakraProvider,
  extendTheme,
  ColorModeScript,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Input,
  Badge,
  Text,
  useColorMode,
  useTheme,
  VStack,
} from "@chakra-ui/react";
import { generateChakraTheme } from "frosting/chakra";
import { STEPS } from "frosting";
import palette from "./palette.js";

const VARIANTS = ["default", "protanopia", "deuteranopia", "tritanopia"] as const;
type Variant = (typeof VARIANTS)[number];

const themes = Object.fromEntries(
  VARIANTS.map((v) => [
    v,
    extendTheme(generateChakraTheme(palette, { variant: v })),
  ]),
) as Record<Variant, ReturnType<typeof extendTheme>>;

function AppContent({
  variant,
  setVariant,
}: {
  variant: Variant;
  setVariant: (v: Variant) => void;
}) {
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const brand1 = theme.colors?.brand1 as Record<number, string> | undefined;
  const brand2 = theme.colors?.brand2 as Record<number, string> | undefined;
  const neutral = theme.colors?.neutral as Record<number, string> | undefined;

  return (
    <Box minH="100vh" bg="background" color="foreground">
      <Box maxW="4xl" mx="auto" p={6}>
        <Box as="header" borderBottomWidth="1px" borderColor="border" pb={4}>
          <Heading size="lg" color="foreground">
            Frosting Chakra Demo
          </Heading>
          <Text mt={1} fontSize="sm" color="muted-foreground">
            Toggle mode and CVD variant to see the palette update.
          </Text>
        </Box>

        <VStack align="stretch" spacing={8} mt={8}>
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color="foreground"
              mb={3}
            >
              Toolbar
            </Text>
            <HStack flexWrap="wrap" gap={4}>
              <HStack gap={2}>
                <Text fontSize="sm" color="muted-foreground">
                  Mode:
                </Text>
                <ButtonGroup size="sm" isAttached>
                  <Button
                    onClick={toggleColorMode}
                    colorScheme={colorMode === "light" ? "brand1" : "gray"}
                    variant={colorMode === "light" ? "solid" : "outline"}
                  >
                    {colorMode}
                  </Button>
                </ButtonGroup>
              </HStack>
              <HStack gap={2}>
                <Text fontSize="sm" color="muted-foreground">
                  Variant:
                </Text>
                <ButtonGroup size="sm" gap={1}>
                  {VARIANTS.map((v) => (
                    <Button
                      key={v}
                      onClick={() => setVariant(v)}
                      colorScheme="brand1"
                      variant={variant === v ? "solid" : "ghost"}
                    >
                      {v}
                    </Button>
                  ))}
                </ButtonGroup>
              </HStack>
            </HStack>
          </Box>

          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color="foreground"
              mb={3}
            >
              Semantic token showcase
            </Text>
            <HStack align="stretch" gap={4} flexWrap="wrap">
              <Card bg="card" color="card-foreground" borderWidth="1px" borderColor="border" flex="1" minW="200px">
                <CardHeader>
                  <Heading size="sm">Card</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="sm" color="muted-foreground">
                    Uses card and card-foreground.
                  </Text>
                </CardBody>
              </Card>
              <Box
                bg="muted"
                color="muted-foreground"
                p={4}
                borderRadius="md"
                flex="1"
                minW="200px"
              >
                <Text fontWeight="medium">Muted block</Text>
                <Text fontSize="sm" mt={1} opacity={0.9}>
                  Uses muted tokens.
                </Text>
              </Box>
            </HStack>
            <HStack gap={3} mt={4} flexWrap="wrap">
              <Button bg="primary" color="primary-foreground" _hover={{ opacity: 0.9 }}>
                Primary
              </Button>
              <Button bg="secondary" color="secondary-foreground" _hover={{ opacity: 0.9 }}>
                Secondary
              </Button>
              <Button bg="accent" color="accent-foreground" _hover={{ opacity: 0.9 }}>
                Accent
              </Button>
            </HStack>
            <HStack gap={2} mt={3} flexWrap="wrap">
              <Badge bg="primary" color="primary-foreground" borderRadius="full" px={2.5} py={0.5}>
                Badge primary
              </Badge>
              <Badge bg="ring" color="foreground" borderRadius="full" px={2.5} py={0.5}>
                Badge ring
              </Badge>
            </HStack>
            <Input
              placeholder="Input (border)"
              borderColor="border"
              bg="background"
              color="foreground"
              _placeholder={{ color: "muted-foreground" }}
              focusBorderColor="ring"
              maxW="xs"
              mt={3}
            />
          </Box>

          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
              color="foreground"
              mb={3}
            >
              Ramp display
            </Text>
            <VStack align="stretch" spacing={4}>
              {brand1 && (
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color="muted-foreground" mb={2}>
                    brand1
                  </Text>
                  <HStack gap={0.5} flexWrap="wrap">
                    {STEPS.map((step) => (
                      <Box
                        key={step}
                        w={10}
                        h={10}
                        borderRadius="md"
                        bg={brand1[step]}
                        title={String(step)}
                      />
                    ))}
                  </HStack>
                </Box>
              )}
              {brand2 && (
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color="muted-foreground" mb={2}>
                    brand2
                  </Text>
                  <HStack gap={0.5} flexWrap="wrap">
                    {STEPS.map((step) => (
                      <Box
                        key={step}
                        w={10}
                        h={10}
                        borderRadius="md"
                        bg={brand2[step]}
                        title={String(step)}
                      />
                    ))}
                  </HStack>
                </Box>
              )}
              {neutral && (
                <Box>
                  <Text fontSize="xs" fontWeight="medium" color="muted-foreground" mb={2}>
                    neutral
                  </Text>
                  <HStack gap={0.5} flexWrap="wrap">
                    {STEPS.map((step) => (
                      <Box
                        key={step}
                        w={10}
                        h={10}
                        borderRadius="md"
                        bg={neutral[step]}
                        title={String(step)}
                      />
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}

export default function App() {
  const [variant, setVariant] = useState<Variant>("default");
  const theme = themes[variant];

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode="light" />
      <AppContent variant={variant} setVariant={setVariant} />
    </ChakraProvider>
  );
}
