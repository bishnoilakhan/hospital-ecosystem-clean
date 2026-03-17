// Hospital controller for admin management and listing
const { isValidObjectId } = require("mongoose");
const Hospital = require("../models/Hospital");

const createHospital = async (req, res) => {
  try {
    const { name, address = "", phone = "" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Hospital name is required", data: null });
    }

    const hospital = await Hospital.create({
      name: name.trim(),
      address,
      phone
    });

    return res.status(201).json({
      message: "Hospital created",
      data: hospital
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create hospital", data: null });
  }
};

const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Hospitals fetched",
      data: hospitals
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch hospitals", data: null });
  }
};

const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid id", data: null });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found", data: null });
    }

    return res.status(200).json({ message: "Hospital fetched", data: hospital });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch hospital", data: null });
  }
};

module.exports = { createHospital, getHospitals, getHospitalById };
