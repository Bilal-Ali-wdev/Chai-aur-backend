// import { ApiError } from "../utils/apiError.js";
// const asyncHandler = (fn) => {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch((err) => {
//       if (err instanceof ApiError) {
//         res.status(err.statuscode).json({
//           message: err.message,
//           success: false,
//           data: null,
//           error: err.error,
//         });
//       } else {
//         next(err);
//       }
//     });
//   };
// };
// const asyncHandler = (fn) => {
//   return(req, res, next) => {
//    Promise.resolve(fn(req, res, next)).catch((err) => {
//        next(err)
//    });
//  };
// };
const asyncHandler=(fn)=>{
  return (req,res,next)=>{
      fn(req,res,next).catch((err)=>{
          next(err)
      })
  }
}
export { asyncHandler };
