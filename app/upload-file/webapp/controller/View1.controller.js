sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("uploadfile.controller.View1", {
    dataArray: [],

    onInit: function () {
      this.dataArray = [];
    },

    handleUploadPress: function () {
      const uploader = this.getView().byId("fileUploader");
      const fileInput = uploader.getDomRef("fu");

      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        this._processExcel(file);
      } else {
        MessageToast.show("Please select a file first.");
      }
    },

    _processExcel: function (file) {
      const reader = new FileReader();
      const that = this;

      reader.onload = function (e) {
        const binary = e.target.result;
        const workbook = XLSX.read(binary, { type: "binary" });

        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Validate and filter rows
        const validRows = [];
        const invalidRows = [];

        jsonData.forEach((row, index) => {
          if (row.ID && row.Name && row.Email && row.Department && row.Year && row.Contact) {
            validRows.push(row);
          } else {
            invalidRows.push({ row: index + 2, data: row }); // +2 for Excel row index
          }
        });

        that.dataArray = validRows;

        const oModel = new sap.ui.model.json.JSONModel({ dataArray: validRows });
        that.getView().setModel(oModel);
        that.getView().byId("excelTable").setVisible(true);

        if (invalidRows.length > 0) {
          MessageBox.warning(`Some rows have missing fields and were skipped:\n` +
            invalidRows.map(e => `Row ${e.row}`).join(", "));
        }

        console.log("Valid Data to Upload:", validRows);
      };

      reader.readAsBinaryString(file);
    },

    onPostData: function () {
      const that = this;
      const dataToPost = this.getView().getModel().getProperty("/dataArray");

      if (!dataToPost || dataToPost.length === 0) {
        MessageToast.show("No data available to post.");
        return;
      }

      const serviceUrl = this.getOwnerComponent().getModel().sServiceUrl;
      const postUrl = `${serviceUrl}/Students`;

      let successCount = 0;
      let errorMessages = [];

      dataToPost.forEach((student) => {
        $.ajax({
          url: postUrl,
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(student),
          success: function () {
            successCount++;
            if (successCount + errorMessages.length === dataToPost.length) {
              that._showUploadSummary(successCount, errorMessages);
            }
          },
          error: function (xhr) {
            const errorMsg = `Error for ${student.Name || "Unknown"}: ${xhr.responseText}`;
            errorMessages.push(errorMsg);
            if (successCount + errorMessages.length === dataToPost.length) {
              that._showUploadSummary(successCount, errorMessages);
            }
          }
        });
      });
    },

    _showUploadSummary: function (successCount, errorMessages) {
      if (errorMessages.length === 0) {
        MessageToast.show("All records uploaded successfully!");
      } else {
        MessageBox.error(
          `Upload completed.\n\nSuccess: ${successCount}\nFailed: ${errorMessages.length}\n\nErrors:\n` +
          errorMessages.join("\n")
        );
      }
    }
  });
});
