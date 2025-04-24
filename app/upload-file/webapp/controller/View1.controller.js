sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/m/PDFViewer"   

], function (Controller, MessageToast, MessageBox, PDFViewer) {
  "use strict";

  return Controller.extend("uploadfile.controller.View1", {
    dataArray: [],

    onInit: function () {
      this.dataArray = [];
    },

    // handleUploadPress: function () {
    //   const uploader = this.getView().byId("fileUploader");
    //   const fileInput = uploader.getDomRef("fu");

    //   if (fileInput && fileInput.files.length > 0) {
    //     const file = fileInput.files[0];
    //     this._processExcel(file);
    //   } else {
    //     MessageToast.show("Please select a file first.");
    //   }
    // },

    _processExcel: function (file) {
      const reader = new FileReader();
      const that = this;

      reader.onload = function (e) {
        const binary = e.target.result;
        const workbook = XLSX.read(binary, { type: "binary" });

        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const validRows = [];
        const invalidRows = [];

        jsonData.forEach((row, index) => {
          if (row.ID && row.Name && row.Email && row.Department && row.Year && row.Contact) {
            validRows.push(row);
          } else {
            invalidRows.push({ row: index + 2, data: row });
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
      };

      reader.readAsBinaryString(file);
    },

    // onPostData: function () {
    //   const that = this;
    //   const dataToPost = this.getView().getModel().getProperty("/dataArray");

    //   if (!dataToPost || dataToPost.length === 0) {
    //     MessageToast.show("No data available to post.");
    //     return;
    //   }

    //   const serviceUrl = this.getOwnerComponent().getModel().sServiceUrl;
    //   const postUrl = `${serviceUrl}/Students`;

    //   let successCount = 0;
    //   let errorMessages = [];

    //   dataToPost.forEach((student) => {
    //     $.ajax({
    //       url: postUrl,
    //       method: "POST",
    //       contentType: "application/json",
    //       data: JSON.stringify(student),
    //       success: function () {
    //         successCount++;
    //         if (successCount + errorMessages.length === dataToPost.length) {
    //           that._showUploadSummary(successCount, errorMessages);
    //         }
    //       },
    //       error: function (xhr) {
    //         const errorMsg = `Error for ${student.Name || "Unknown"}: ${xhr.responseText}`;
    //         errorMessages.push(errorMsg);
    //         if (successCount + errorMessages.length === dataToPost.length) {
    //           that._showUploadSummary(successCount, errorMessages);
    //         }
    //       }
    //     });
    //   });
    // },

    onPostData: function () {
      const that = this;
      const uploader = this.getView().byId("fileUploader");
      const fileInput = uploader.getDomRef("fu");
    
      if (!fileInput || fileInput.files.length === 0) {
        MessageToast.show("Please select a file first.");
        return;
      }
    
      const file = fileInput.files[0];
      const reader = new FileReader();
    
      reader.onload = function (e) {
        const binary = e.target.result;
        const workbook = XLSX.read(binary, { type: "binary" });
    
        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
    
        const validRows = [];
        const invalidRows = [];
    
        jsonData.forEach((row, index) => {
          if (row.ID && row.Name && row.Email && row.Department && row.Year && row.Contact) {
            validRows.push(row);
          } else {
            invalidRows.push({ row: index + 2, data: row });
          }
        });
    
        if (invalidRows.length > 0) {
          MessageBox.warning(`Some rows have missing fields and were skipped:\n` +
            invalidRows.map(e => `Row ${e.row}`).join(", "));
        }
    
        that.dataArray = validRows;
    
        const oModel = new sap.ui.model.json.JSONModel({ dataArray: validRows });
        that.getView().setModel(oModel);
        // this for binding to table for display data on page
        // that.getView().byId("excelTable").setVisible(true);
    
        if (validRows.length === 0) {
          MessageToast.show("No valid data found to post.");
          return;
        }
    
        // POST to backend
        const serviceUrl = that.getOwnerComponent().getModel().sServiceUrl;
        const postUrl = `${serviceUrl}/Students`;
    
        let successCount = 0;
        let errorMessages = [];
    
        validRows.forEach((student) => {
          $.ajax({
            url: postUrl,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(student),
            success: function () {
              successCount++;
              if (successCount + errorMessages.length === validRows.length) {
                that._showUploadSummary(successCount, errorMessages);
                if (errorMessages.length === 0) {
                }
              }
            },
            error: function (xhr) {
              const errorMsg = `Error for ${student.Name || "Unknown"}: ${xhr.responseText}`;
              errorMessages.push(errorMsg);
              if (successCount + errorMessages.length === validRows.length) {
                that._showUploadSummary(successCount, errorMessages);
              }

            }
          });
        });
      };
    
      reader.readAsBinaryString(file);
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
    },

    onExportToExcel: function () {
      const data = this.getView().getModel()?.getProperty("/dataArray") || [];
      if (!data.length) {
        MessageToast.show("No data to export.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

      XLSX.writeFile(workbook, "StudentsData.xlsx");
    },


    
    onDownloadFromDB: function () {
      const serviceUrl = this.getOwnerComponent().getModel().sServiceUrl;
      const that = this;
    
      $.ajax({
        url: serviceUrl + "/Students",
        method: "GET",
        success: function (data) {
          if (data && data.value && data.value.length > 0) {
            // Convert JSON to worksheet
            const worksheet = XLSX.utils.json_to_sheet(data.value);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
            // Export to Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    
            // Create download link
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = "All_Students.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
            MessageToast.show("Download started.");
          } else {
            MessageToast.show("No data available to download.");
          }
        },
        error: function () {
          MessageBox.error("Failed to fetch students from database.");
        }
      });
    },

    onPreviewPDF: function () {
      const oModel = this.getView().getModel();
      const aData = oModel.getProperty("/dataArray");
    
      if (!aData || aData.length === 0) {
        sap.m.MessageToast.show("No data to generate PDF.");
        return;
      }
    
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.text("Students Data", 14, 15);
    
      const headers = [["ID", "Name", "Email", "Department", "Year", "Contact"]];
      const rows = aData.map(item => [
        item.ID || "",
        item.Name || "",
        item.Email || "",
        item.Department || "",
        item.Year || "",
        item.Contact || ""
      ]);
    
      doc.autoTable({
        startY: 20,
        head: headers,
        body: rows
      });
    
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
    
      const oPDFViewer = new PDFViewer({
        source: blobUrl,
        title: "Preview - Uploaded Students PDF",
        showDownloadButton: true
      });
    
      this.getView().addDependent(oPDFViewer);
      oPDFViewer.open();
    }
    
    


    
  });
});
