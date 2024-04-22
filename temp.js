let mongoose = require('mongoose')
const { SuperAdmin, Course, Admin, Student } = require('./schema')

mongoose.connect("mongodb+srv://reaabacus1:erGQnoMe3Y5mV1cd@rea.k8odx3q.mongodb.net/REA")
    .catch((err) => {
        console.log(err)
    })

// let courseId = 1
// let taughtBy = 24001

// Admin.findOne(
//     { adminId: 24001, "courses.courseId": 1 },
// ).then(res =>{
//     console.log(res)
// })

// Student.aggregate([
//     {
//         $unwind: "$courses"
//     },
//     {
//         $match: {
//             "courses.courseId": courseId,
//             "courses.taughtBy": taughtBy
//         }
//     },
//     {
//         $project: {
//             _id: 1,
//             email: 1,
//             name: 1,
//             studentId: 1,
//             mobile: 1,
//             dp: 1,
//             batch: "$courses.batch"
//         }
//     }
// ]).then((res)=>{
//     console.log(res)
// })


// Course.aggregate([
//     {
//         $lookup: {
//             from: "admins",
//             localField: "teachers",
//             foreignField: "adminId",
//             as: "teacherDetails"
//         }
//     },
//     {
//         $project: {
//             courseName: 1,
//             courseId: 1,
//             teacherList: {
//                 $map: {
//                     input: "$teacherDetails",
//                     as: "teacher",
//                     in: {
//                         teacherName: "$$teacher.name",
//                         teacherId: "$$teacher.adminId"
//                     }
//                 }
//             },
//             _id:0,
//         }
//     }
// ]).then((courses) => {
//     console.log(courses)
// })

// let c1 = new Course({
//     courseName: "Abacus Juniors",
//     courseId: 1,
//     teachers: [],
//     levels: [{
//         level: 1,
//         resources: []
//     },
//     {
//         level: 2,
//         resources: []
//     },
//     {
//         level: 3,
//         resources: []
//     },
//     {
//         level: 4,
//         resources: []
//     }, {
//         level: 5,
//         resources: []
//     }, {
//         level: 6,
//         resources: []
//     }]
// }
// // )

// let c2 = new Course({
//     courseName: "Abacus Seniors",
//     teachers: [24001 ],
//     courseId: 2,
//     levels: [{
//         level: 1,
//         resources: []
//     },
//     {
//         level: 2,
//         resources: []
//     },
//     {
//         level: 3,
//         resources: []
//     },
//     {
//         level: 4,
//         resources: []
//     },
//     {
//         level: 5,
//         resources: []
//     },
//     {
//         level: 6,
//         resources: []
//     },
//     {
//         level: 7,
//         resources: []
//     },
//     {
//         level: 8,
//         resources: []
//     },
//     {
//         level: 9,
//         resources: []
//     },
//     {
//         level: 10,
//         resources: []
//     }]
// })

// let c3 = new Course({
//     courseName: "Vedic Math",
//     teachers: [24002],
//     courseId: 3,
//     levels: [{
//         level: 1,
//         resources: []
//     },
//     {
//         level: 2,
//         resources: []
//     },
//     {
//         level: 3,
//         resources: []
//     },
//     {
//         level: 4,
//         resources: []
//     },
//     {
//         level: 5,
//         resources: []
//     },
//     {
//         level: 6,
//         resources: []
//     }]
// })

// let c4 = new Course({
//     courseName: "Cursive Writing",
//     teachers: [24002],
//     courseId: 4,
//     levels: [{
//         level: 1,
//         resources: []
//     },
//     {
//         level: 2,
//         resources: []
//     }]
// })

// let c5 = new Course({
//     courseName: "Memory Techniques",
//     teachers: [],
//     courseId: 5,
//     levels: [{
//         level: 1,
//         resources: []
//     },
//     {
//         level: 2,
//         resources: []
//     }]
// })

// let c6 = new Course({
//     courseName: "Rubik's Cube",
//     teachers: [],
//     courseId: 6,
//     levels: [{
//         level: 1,
//         resources: []
//     },
//     {
//         level: 2,
//         resources: []
//     },
//     {
//         level: 3,
//         resources: []
//     }, {
//         level: 4,
//         resources: []
//     }, {
//         level: 5,
//         resources: []
//     }]
// })


//  c1.save()
//  c2.save()
//  c3.save()
//  c4.save()
//  c5.save()
//  c6.save()


// let stud1 = new Student({
//     name: "stud1",
//     studentId: 24001,
//     mobile: 1234567890,
//     courses: [{
//         courseId: 1,
//         level: 1
//     },
//     {
//         courseId: 3,
//         level: 1
//     }]
// })

// let stud2 = new Student({
//     name: "stud2",
//     studentId: 24002,
//     mobile: 1234567899,
//     courses: [{
//         courseId: 2,
//         level: 1
//     },
//     {
//         courseId: 4,
//         level: 1
//     }]
// })

// let stud3 = new Student({
//     name: "stud3",
//     studentId: 24003,
//     mobile: 1234567894,
//     courses: [{
//         courseId: 1,
//         level: 1
//     },
//     {
//         courseId: 4,
//         level: 1
//     }]
// })


// stud1.save()
// stud2.save()
// stud3.save()

// let admin1 = new Admin({
//     name: "admin1",
//     adminId: 24001,
//     mobile: 1234567890,
//     courses: [{
//         courseId: 1,
//         studentList: [24001, 24003]
//     },
//     {
//         courseId: 2,
//         studentList: [24002]
//     }]
// })

// let admin2 = new Admin({
//     name: "admin2",
//     adminId: 24002,
//     mobile: 1234567890,
//     courses: [{
//         courseId: 3,
//         studentList: [24001]
//     },
//     {
//         courseId: 4,
//         studentList: [24002, 24003]
//     }]
// })
// let admin3 = new Admin({
//     name: "admin3",
//     adminId: 24003,
//     mobile: 1234515990,
//     profile: "a very professional and eperienced teacher with 10 years of experience in teaching abacus and vedic math.",
//     courses: [{
//         courseId: 1,
//         studentList: []
//     },
//     {
//         courseId: 4,
//         studentList: []
//     }]
// })
// admin3.save()
// admin1.save()
// admin2.save()

// let superAdmin = new SuperAdmin({
//     name: "superAdmin",
//     email: "qwe@gmail.com",
//     superAdminId: 24001,
//     mobile: 1234567890,
// })

// superAdmin.save()