import { Component, OnInit } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  Validators,
} from "@angular/forms";
import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { ErrorStateMatcher } from "@angular/material/core";
import { MatChipInputEvent } from "@angular/material/chips";
import { FileValidators } from "ngx-file-drag-drop";
import { HttpClient } from "@angular/common/http";
import { formatCurrency } from "@angular/common";
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from "@angular/material/snack-bar";

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: "uploadFile",
  templateUrl: "./uploadFile.component.html",
  styleUrls: ["./uploadFile.component.scss"],
})
export class UploadFileComponent implements OnInit {
  filesList = [];
  recipientsList: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  snackBarHorizontalPosition: MatSnackBarHorizontalPosition = "end";
  snackBarVerticalPosition: MatSnackBarVerticalPosition = "top";

  constructor(private http: HttpClient, private _snackBar: MatSnackBar) {}

  // FORM DECLARATION
  public uploadFileForm = new FormGroup({
    files: new FormControl(
      [],
      [
        FileValidators.required,
        FileValidators.uniqueFileNames,
        FileValidators.maxTotalSize(2097152),
      ]
    ),
    recipients: new FormControl([], [Validators.required, Validators.email]),
    sender: new FormControl("", [Validators.required, Validators.email]),
    message: new FormControl(""),
  });

  // ERRORS MANAGEMENT
  senderErrors() {
    return this.uploadFileForm.controls["sender"].hasError("required")
      ? "Ce champs est obligatoire"
      : this.uploadFileForm.controls["sender"].hasError("email")
      ? "Adresse mail invalide"
      : "";
  }

  recipientsErrors() {
    return this.uploadFileForm.controls["recipients"].hasError("required")
      ? "Ce champs est obligatoire"
      : this.uploadFileForm.controls["recipients"].hasError("email")
      ? "Adresse mail invalide"
      : "";
  }

  filesErrors() {
    return this.uploadFileForm.controls["files"].hasError("uniqueFileNames")
      ? "Chaque fichier doit avoir un nom unique"
      : this.uploadFileForm.controls["files"].hasError("maxTotalSize")
      ? "Poids maximum dépassé (2Mo)"
      : "";
  }

  matcher = new MyErrorStateMatcher();

  // RECIPIENTS INPUT FUNCTIONS
  addRecipient(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if (
      (value || "").trim() &&
      !this.uploadFileForm.controls["recipients"]?.invalid
    ) {
      this.recipientsList.push(value.trim());
    }

    if (input) {
      input.value = "";
    }
  }

  removeRecipient(recipient: string): void {
    const index = this.recipientsList.indexOf(recipient);

    if (index >= 0) {
      this.recipientsList.splice(index, 1);
    }

    if (this.recipientsList.length === 0) {
      this.uploadFileForm.controls["recipients"]?.setErrors({
        required: true,
      });
    }
  }

  // UPLOAD FILES INPUT FUNCTIONS
  onValueChange(file: File[]) {
    console.log("File changed!");
  }
  ngOnInit(): void {
    this.uploadFileForm.controls[
      "files"
    ].valueChanges.subscribe((files: File[]) =>
      console.log(
        this.uploadFileForm.controls["files"].value,
        this.uploadFileForm.controls["files"].valid
      )
    );
  }

  // SUBMIT FUNCTION
  onSubmit() {
    const body = new FormData();

    body.append("sender", this.uploadFileForm.get("sender")?.value);

    for (const recipient of this.uploadFileForm.get("recipients")?.value) {
      body.append("recipients[]", recipient);
    }

    for (const file of this.uploadFileForm.get("files")?.value) {
      body.append("files[]", file);
    }

    this.http.post("http://localhost:8001/api/upload", body).subscribe(
      (res: any) => console.log(res),
      (err: any) => console.log(err)
    );

    this.openSnackBar();
    this.clearForm();
  }

  clearForm() {
    this.uploadFileForm.reset({
      files: [],
      recipients: [],
      sender: "",
      message: "",
    });
    Object.keys(this.uploadFileForm.controls).forEach((key) =>
      this.uploadFileForm.get(key)?.setErrors(null)
    );
  }

  openSnackBar() {
    this._snackBar.open("Vos fichiers ont été envoyé", "Fermer", {
      horizontalPosition: this.snackBarHorizontalPosition,
      verticalPosition: this.snackBarVerticalPosition,
    });
  }
}
