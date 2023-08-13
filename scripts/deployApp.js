/* global ethers */

const { getSelectors, FacetCutAction } = require("../scripts/libs/diamond.js")
const { ethers } = require('hardhat')

async function main() {

    const accounts = await ethers.getSigners()
    const owner = accounts[0]
    
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});