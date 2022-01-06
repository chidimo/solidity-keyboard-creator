async function main() {
  const [owner, somebodyElse] = await hre.ethers.getSigners();

  const keyboardsContractFactory = await hre.ethers.getContractFactory(
    "Keyboards"
  );
  const keyboardsContract = await keyboardsContractFactory.deploy();
  await keyboardsContract.deployed();

  console.log("Contract deployed to:", keyboardsContract.address);

  const keyboardTxn1 = await keyboardsContract.create(0, true, "sepia");
  keyboardTxn1Receipt = await keyboardTxn1.wait();
  console.log("Created keyboard event", keyboardTxn1Receipt.events);

  const keyboardTxn2 = await keyboardsContract
    .connect(somebodyElse)
    .create(1, false, "grayscale");
  keyboardTxn2Receipt = await keyboardTxn2.wait();
  console.log("Created another keyboard event", keyboardTxn2Receipt.events);

  const balanceBefore = await hre.ethers.provider.getBalance(
    somebodyElse.address
  );
  console.log(
    "somebodyElse balance before!",
    hre.ethers.utils.formatEther(balanceBefore)
  );

  const tipTxn = await keyboardsContract.tip(1, {
    value: hre.ethers.utils.parseEther("1000"),
  });
  tipTxnReceipt = await tipTxn.wait();
  console.log("Tipped event", tipTxnReceipt.events);

  const balanceAfter = await hre.ethers.provider.getBalance(
    somebodyElse.address
  );
  console.log(
    "somebodyElse balance after!",
    hre.ethers.utils.formatEther(balanceAfter)
  );

  keyboards = await keyboardsContract.getKeyboards();
  console.log("We got the keyboards:", keyboards);

  keyboards = await keyboardsContract.connect(somebodyElse).getKeyboards();
  console.log("And as somebody else!", keyboards);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
