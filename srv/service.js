// const cds = require('@sap/cds');

// module.exports = cds.service.impl(async function () {
//   const { Students } = this.entities;

//   this.on('uploadStudents', async (req) => {
//     const data = req.data.data;

//     try {
//       const result = await INSERT.into(Students).entries(data);
//       return { message: `${result.length} students uploaded successfully.` };
//     } catch (error) {
//       req.error(500, `Upload failed: ${error.message}`);
//     }
//   });
// });
