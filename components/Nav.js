import Link from 'next/link'
import { Flex, Spacer } from '@chakra-ui/react'

export default function Nav() {
  return (
      <Flex direction="row" w="100%" p="5" bg="gray.300">
        <Spacer />
        <Link href="/">Home</Link>
        <Spacer />
        <Link href="/about">About</Link>
        <Spacer />
        <Link href="/index">Blog</Link>
        <Spacer />
        <Link href="/work">Work</Link>
        <Spacer />
        <Link href="/contact">Contact</Link>
        <Spacer />
      </Flex>
  )
}