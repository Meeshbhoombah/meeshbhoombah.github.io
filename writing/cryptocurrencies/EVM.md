# The EVM
Synthesized learnings from various sources and explorations. Primarily:
- The Ethereum Yellowpaper
- My own Copywork of OpenZepplin's Smart Contract Suite (v0.8.0)
- [The EVM Illustrated](https://takenobu-hs.github.io/downloads/ethereum_evm_illustrated.pdf)
- StackExchange

## 256-Bit Words
Yellowpaper, Section 9.1. **Basics**:
> The EVM is a simple stack-based architecture. The word size of the machine 
> (and thus size of stack items) is 256-bit. This was chosen to facilitate the 
> Keccak256 hash scheme and elliptic-curve computations.

This is unique, most modern desektop computers have 64-bit words.

## Op-Codes Gas Costs
## Externally Owned Accounts v.s Smart Contract Accounts
## The Broken Native `transfer`
