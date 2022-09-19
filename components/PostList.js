import { Box, Image, List, ListItem, Stack, HStack, VStack } from '@chakra-ui/react';
import Link from 'next/link';

export default function PostList({ posts }) {
  if (posts === 'undefined') return null
  return (
    <div>
      {!posts && <div>No posts!</div>}
      <List >
        <Stack direction={['column', 'row']} spacing='24px'>
        {posts &&
          posts.map((post) => {
            return (
              <Box key={post.slug} maxW='md' p={5} shadow='md' borderWidth='1px' borderRadius='lg' overflow='hidden' bg='yellow.200'>
                <Image src={post.imageUrl} alt={post.imageAlt}/>
            <ListItem key={post.slug}>
                {post.frontmatter.date}:{` `}
                <Link href={{ pathname: `/post/${post.slug}` }}>
                  <a>{post?.frontmatter?.title}</a>
                </Link>
            </ListItem>    
              </Box>
            )
          })}
        </Stack>
        </List>
    </div>
  )
}

export async function getStaticProps() {
  const configData = await import(`../siteconfig.json`)

  const posts = ((context) => {
    return getPosts(context)})
    (require.context('../posts', true, /\.md$/))
    return {
      props: {
        posts,
        title: configData.default.title,
        description: configData.default.description,
      },
    }
  }