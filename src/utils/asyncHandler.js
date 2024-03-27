const asynchandler = (requesthandler)=>{
    return  (req, res, next) =>{
        Promise.resolve(requesthandler(req, res, next))
        .catch((err)=> next(err))
    }
}


export {asynchandler};

















///second way to write above code
// const aasynchandler = (fn) => async (req, res, next) => {
//     try{
//         await fn(req, res, next)
//     }catch(error){
//         res.status(err.code || 500).json({
//             success:false,
//             message:er.message
//         })
//     }
// }
