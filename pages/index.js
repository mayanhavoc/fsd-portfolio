import { Box, Button, Center, Heading, Text } from '@chakra-ui/react'
import Layout from '@components/Layout';
import PostList from '@components/PostList';

import getPosts from '@utils/getPosts';

const Index = ({ posts, title, description, ...props}) => {
  return (
    <Layout pageTitle={title} description={description}>
      <Center h='32rem'>
        <Box maxW='32rem'>
          <Heading mb={4} as='h1' size='4xl'>RM</Heading>
          <Text fontSize='xl'>
            Full Stack Software Developer
          </Text>
          <Button size='lg' colorScheme='green' mt='24px'>
            Get in touch
          </Button>
        </Box>
      </Center>
      <Center>
        <Box>
          <PostList posts={posts}/>
        </Box>
      </Center>
    </Layout>
  )
}

export default Index

export async function getStaticProps() {
  const configData = await import(`../siteconfig.json`)

  const posts = ((context) => {
    return getPosts(context)
  })(require.context('../posts', true, /\.\/.*\.md$/))

  return {
    props: {
      posts,
      title: configData.default.title,
      description: configData.default.description,
    },
  }
}
