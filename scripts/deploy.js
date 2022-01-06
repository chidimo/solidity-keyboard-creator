async function main() {
  const keyboardContracFactory = await hre.ethers.getContractFactory(
    "Keyboards"
  );
  const keyboardContract = await keyboardContracFactory.deploy();
  await keyboardContract.deployed();

  console.log("The keyboards contract is deployed!", keyboardContract.address);

  const keyboards = await keyboardContract.getKeyboards();
  console.log("We got the keyboards!", keyboards);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
