import { ChakraProvider, Box } from '@chakra-ui/react';
import { ApolloProvider } from '@apollo/client';
import client from '../apollo-client';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
    <ChakraProvider>  
        <Box w='80%' mx='auto' p='5' mb='24'>
          <Component {...pageProps} />
        </Box>
    </ChakraProvider>
    </ApolloProvider>
  )
}

export default MyApp
