import React from 'react';
import Link from 'next/link';
import { useDisclosure } from '@chakra-ui/react';
import { Button, Flex, Spacer } from '@chakra-ui/react'
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react'


export default function Nav() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = React.useRef()

  return (
    <>
      <Button ref={btnRef} colorScheme='teal' onClick={onOpen}>
        Open
      </Button>
      <Drawer
        isOpen={isOpen}
        placement='right'
        onClose={onClose}
        finalFocusRef={btnRef}
      >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerBody>
          <Flex direction="column" w="100%" p="5" bg="gray.300">
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
        </DrawerBody>
      </DrawerContent>
      </Drawer>
    </>
  )
}