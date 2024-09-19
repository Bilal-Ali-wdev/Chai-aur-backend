// class ApiError extends Error {
//   constructor(
//     statuscode,
//     message = "something went wrong",
//     error = [],
//     stack = ""
//   ) {
//     super(message);
//     this.statuscode = statuscode;
//     this.message = message;
//     this.data = null;
//     this.success = false;
//     this.error = error;

//     if (stack) {
//       this.stack = stack;
//     } else {
//       Error.captureStackTrace(this, this.constructor);
//     }
//   }
// }
class ApiError extends Error{
  constructor(status,message){
      super()
      this.status=status
      this.message=message
  }
}
export { ApiError };
