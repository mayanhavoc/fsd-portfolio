import Link from 'next/link';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import { Box, Button, Heading } from '@chakra-ui/react'
import Layout from '@components/Layout';
import getSlugs from '@utils/getSlugs';

export default function BlogPost({ siteTitle, frontmatter, markdownBody }) {
  if (!frontmatter) return <></>

  return (
      <Layout pageTitle={`${siteTitle} | ${frontmatter.title}`}>
        <Link href="/">
          <Button>
            <a>Back to post list</a>
          </Button>
        </Link>
        <article>
          <Heading as='h1'>{frontmatter.title}</Heading>
          <p>By {frontmatter.author}</p>
          <Box m={4}>
            <ReactMarkdown children={markdownBody} />
          </Box>
        </article>
      </Layout>
  )
}

export async function getStaticProps({ ...ctx }) {
  const { postname } = ctx.params

  const content = await import(`../../posts/${postname}.md`)
  const config = await import(`../../siteconfig.json`)
  const data = matter(content.default)

  return {
    props: {
      siteTitle: config.title,
      frontmatter: data.data,
      markdownBody: data.content,
    },
  }
}

export async function getStaticPaths() {
  const blogSlugs = ((context) => {
    return getSlugs(context)
  })(require.context('../../posts', true, /\.md$/))

  const paths = blogSlugs.map((slug) => `/post/${slug}`)

  return {
    paths, // An array of path names, and any params
    fallback: false, // so that 404s properly appear if something's not matching
  }
}