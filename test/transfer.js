/* global ethers */

const { getSelectors, FacetCutAction } = require("../scripts/libs/diamond.js")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const DIAMOND_ABI = require('./abi/App.json')

/* Ethereum */

const USDC_ABI = require('./abi/USDC.json')
const USDC_Addr = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_Whale = '0xE52267e0f5488214088DD825a549d0a09b7A154b'

describe("Test transfer functions", function() {

    async function deploy() {

        const accounts = await ethers.getSigners()
        const owner = accounts[0]
        const recipient = accounts[1]
        const signer = await ethers.provider.getSigner(0)
        const whaleSigner = await ethers.getImpersonatedSigner(USDC_Whale)

        console.log(await helpers.time.latestBlock())
    
        // Deploy DiamondCutFacet
        const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet")
        const diamondCutFacet = await DiamondCutFacet.deploy()
        await diamondCutFacet.waitForDeployment()
        console.log("DiamondCutFacet deployed: ", await diamondCutFacet.getAddress())
            
        // Deploy Diamond
        const Diamond = await ethers.getContractFactory("Diamond")
        const diamond = await Diamond.deploy(
            await owner.getAddress(),
            await diamondCutFacet.getAddress()
        )
        await diamond.waitForDeployment()
        console.log("Diamond deployed: ", await diamond.getAddress())

        // Deploy DiamondInit
        // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
        // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
        const DiamondInit = await ethers.getContractFactory('InitDiamond')
        const diamondInit = await DiamondInit.deploy()
        await diamondInit.waitForDeployment()
        console.log('DiamondInit deployed:', await diamondInit.getAddress())
    
        // Deploy facets
        console.log('')
        console.log('Deploying facets')
        const FacetNames = [
            'DiamondLoupeFacet',
            'OwnershipFacet',
            'TransferFacet'
        ]
        const cut = []
        for (const FacetName of FacetNames) {
            const Facet = await ethers.getContractFactory(FacetName)
            const facet = await Facet.deploy()
            await facet.waitForDeployment()
            console.log(`${FacetName} deployed: ${await facet.getAddress()}`)
            cut.push({
                facetAddress: await facet.getAddress(),
                action: FacetCutAction.Add,
                functionSelectors: getSelectors(facet)
            })
        }

        // Upgrade diamond with facets
        console.log('')
        console.log('Diamond Cut:', cut)
        const diamondCut = await ethers.getContractAt('IDiamondCut', await diamond.getAddress())
        let tx
        let receipt
        // Call to init function
        let functionCall = diamondInit.interface.encodeFunctionData('init')
        tx = await diamondCut.diamondCut(cut, await diamondInit.getAddress(), functionCall)
        console.log('Diamond cut tx: ', tx.hash)
        receipt = await tx.wait()
        if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${tx.hash}`)
        }
        console.log('Completed diamond cut')

        // Transfer USDC from Whale to Owner
        const whaleUsdc = (await ethers.getContractAt(USDC_ABI, USDC_Addr)).connect(whaleSigner)
        await whaleUsdc.transfer(await owner.getAddress(), '10000000000') // 10k USDC

        const usdc = (await ethers.getContractAt(USDC_ABI, USDC_Addr)).connect(signer)
        const app = (await ethers.getContractAt(DIAMOND_ABI, await diamond.getAddress())).connect(signer)

        return { owner, recipient, usdc, app }
    }

    it("Should transfer USDC using 'transferToken()'", async function() {

        const { owner, app, usdc, recipient } = await loadFixture(deploy)

        const usdcBal = await usdc.balanceOf(await owner.getAddress())
        console.log(usdcBal)

        await usdc.approve(await app.getAddress(), usdcBal)
        console.log('Approved USDC spend')
        await app.transferToken(USDC_Addr, await recipient.getAddress(), usdcBal)

        expect(await usdc.balanceOf(await recipient.getAddress())).to.equal(usdcBal)
        expect(await usdc.balanceOf(await owner.getAddress())).to.equal(0)
    })

    it("Should transfer Ether using 'transferEth()'", async function() {

        const { app, recipient } = await loadFixture(deploy)

        const t0_recipient_ethBal = await ethers.provider.getBalance(await recipient.getAddress())
        const _value = ethers.parseEther('10')

        await app.transferEth(await recipient.getAddress(), {value: _value})

        expect(await ethers.provider.getBalance(await recipient.getAddress())).to.equal(
            t0_recipient_ethBal + _value
        )
    })
})