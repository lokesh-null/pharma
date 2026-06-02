import { expect } from "chai";
import { ethers } from "hardhat";

describe("PharmaLyncCore", function () {
  let pharmaLyncCore: any;
  let owner: any;
  let manufacturer: any;
  let pharmacy: any;
  let otherAccount: any;

  beforeEach(async function () {
    // Get signers
    [owner, manufacturer, pharmacy, otherAccount] = await ethers.getSigners();

    // Deploy contract
    const PharmaLyncCore = await ethers.getContractFactory("PharmaLyncCore");
    pharmaLyncCore = await PharmaLyncCore.deploy();

    // Set roles
    const MANUFACTURER_ROLE = await pharmaLyncCore.MANUFACTURER_ROLE();
    const PHARMACY_ROLE = await pharmaLyncCore.PHARMACY_ROLE();

    await pharmaLyncCore.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await pharmaLyncCore.grantRole(PHARMACY_ROLE, pharmacy.address);
  });

  describe("Medicine Registration and Dispensing", function () {
    it("Should prevent double-dispensing of the same medicine", async function () {
      // Manufacturer registers a medicine
      await pharmaLyncCore
        .connect(manufacturer)
        .registerMedicine("Paracetamol", "Cipla", "BATCH123");

      const medicineId = 1;

      // Pharmacy dispenses the medicine
      await expect(pharmaLyncCore.connect(pharmacy).dispenseMedicine(medicineId))
        .to.emit(pharmaLyncCore, "MedicineDispensed")
        .withArgs(medicineId, pharmacy.address, (await ethers.provider.getBlock("latest"))!.timestamp + 1);

      // Verify it's dispensed
      expect(await pharmaLyncCore.isMedicineDispensed(medicineId)).to.be.true;

      // Pharmacy attempts to dispense the same medicine AGAIN
      await expect(
        pharmaLyncCore.connect(pharmacy).dispenseMedicine(medicineId)
      ).to.be.revertedWith("Medicine already dispensed");
    });
  });
});
