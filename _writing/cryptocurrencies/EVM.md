---
layout: writing
status: draft
description: Technical notes on the Ethereum Virtual Machine.
category: Cryptocurrencies
tags: [writing, cryptocurrencies]
---

# EVM

Synthesized learnings from various sources and explorations. Primarily:
- The Ethereum Yellowpaper
- My own Copywork of OpenZepplin's Smart Contract Suite (v0.8.0)
- [The EVM Illustrated](https://takenobu-hs.github.io/downloads/ethereum_evm_illustrated.pdf)
- StackExchange

## Stack-Based
## 256-Bit Words
Yellowpaper, Section 9.1. **Basics**:
> The EVM is a simple stack-based architecture. The word size of the machine 
> (and thus size of stack items) is 256-bit. This was chosen to facilitate the 
> Keccak256 hash scheme and elliptic-curve computations.

This is unique, most modern computers have 64-bit words. 

The precise data-type used within Ethereum Virtual Machine for each word is a 
`uint256`. 

## Memeory is a Word-Addressable Byte Array
Yellowpaper, Section 9.1. **Basics**:
> The memory model is a simple word-addressed byte array. 

## Storage is a Word-Addressable Word Array
Yellowpaper, Section 9.1. **Basics**:
> word-addressable word array

## The "Slots" in Memory and Storage are Indicies in their Respective Arrays

## Externally Owned Accounts v.s Smart Contract Accounts
Within Ethereum, these two types of accounts are neearly

## The Broken Native `transfer`
