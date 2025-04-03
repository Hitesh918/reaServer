let express = require('express');
let mongoose = require('mongoose')
const cors = require("cors");
const { SuperAdmin, Course, Admin, Student, Counter, Event, Page, Submission } = require('./schema');
const e = require('express');
let cloudinary = require('cloudinary').v2;

let app = express();
app.use(cors())
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb" }));

mongoose.connect("mongodb+srv://reaabacus1:erGQnoMe3Y5mV1cd@rea.k8odx3q.mongodb.net/REA")
    .catch((err) => {
        console.log(err)
    })


cloudinary.config({
    cloud_name: 'dsusqpe6b',
    api_key: '384114425379965',
    api_secret: 'xpcvc4YXZW1UimnYjADGvVu23g8',
    secure: true
});

const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
};

app.get("/courseList", async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                $lookup: {
                    from: "admins",
                    localField: "teachers",
                    foreignField: "adminId",
                    as: "teacherDetails"
                }
            },
            {
                $project: {
                    courseName: 1,
                    courseId: 1,
                    teacherList: {
                        $map: {
                            input: "$teacherDetails",
                            as: "teacher",
                            in: {
                                teacherName: "$$teacher.name",
                                teacherId: "$$teacher.adminId"
                            }
                        }
                    },
                    numberOfLevels: { $size: "$levels" },
                    _id: 0,
                }
            }
        ])
        // console.log(courses);
        res.send(courses);
    } catch (error) {
        console.error('Error finding courses:', error);
    }
})

app.get("/getCourseDetails", async (req, res) => {
    // console.log(req.query)
    try {
        const stud = await Student.findOne({ studentId: req.query.studentId });
        if (!stud) {
            console.log('Student not found');
            return;
        }
        let teacherName = stud.courses.find((course) => { if (course.courseId == req.query.courseId) { return course.taughtBy } })
        // console.log(teacherName)
        const teacher = await Admin.findOne({ adminId: teacherName.taughtBy });
        res.send({
            teacherName: teacher.name,
            teacherId: teacher.adminId,
            profile: teacher.profile,
        });
    }
    catch (error) {
        console.error('Error finding course:', error);
    }
});

app.get("/getResources", async (req, res) => {
    // console.log(req.query)
    let courseId = parseInt(req.query.courseId);
    let level = parseInt(req.query.level);
    try {
        const course = await Course.findOne({ courseId: courseId });
        if (!course) {
            console.log('Course not found');
            return;
        }
        const resources = course.levels[level - 1].resources;
        res.send(resources);
        // console.log(resources);
    } catch (error) {
        console.error('Error finding course:', error);
    }
})

app.get("/getClassLink", async (req, res) => {
    // console.log(req.query)
    let courseId = parseInt(req.query.courseId);
    let studentId = parseInt(req.query.studentId);
    try {
        const student = await Student.findOne({ studentId: studentId });
        if (!student) {
            console.log('Student not found');
            return;
        }
        const course = student.courses.find(course => course.courseId === courseId);
        if (!course) {
            console.log('Course not found');
            return;
        }
        // console.log(course)
        res.send(course);
    }
    catch (error) {
        console.error('Error finding course:', error);
    }
})

app.get("/adminDetails", async (req, res) => {
    // console.log(req.query)
    let id = req.query.adminId;
    try {
        const admin = await Admin.findOne({ adminId: id });
        if (!admin) {
            console.log('Admin not found');
            return;
        }
        const courses = [];
        for (const course of admin.courses) {
            const courseDetail = await Course.findOne({ courseId: course.courseId });
            if (courseDetail) {
                courses.push({
                    courseId: courseDetail.courseId,
                    courseName: courseDetail.courseName,
                    numberOfLevels: courseDetail.levels.length,
                    numberOfBatches: course.numberOfBatches
                });
            }
        }

        const result = {
            name: admin.name,
            adminId: admin.adminId,
            mobile: admin.mobile,
            courses: courses,
            email: admin.email,
            dp: admin.dp,
        };
        res.send(result);
        // console.log(result);
    } catch (error) {
        console.error('Error finding admin:', error);
    }

})

app.get("/getStudentsUnderTeacher", async (req, res) => {
    // console.log(req.query)
    let taughtBy = req.query.adminId
    let courseId = parseInt(req.query.courseId)
    try {
        let students = await Student.aggregate([
            {
                $unwind: "$courses"
            },
            {
                $match: {
                    "courses.courseId": courseId,
                    "courses.taughtBy": taughtBy
                }
            },
            {
                $project: {
                    _id: 1,
                    email: 1,
                    name: 1,
                    studentId: 1,
                    mobile: 1,
                    dp: 1,
                    batch: "$courses.batch"
                }
            }
        ])
        res.send(students);
    }
    catch (error) {
        console.error('Error finding students:', error);
    }
})

app.get("/getStudentList", async (req, res) => {
    // console.log(req.query)
    let courseId = parseInt(req.query.courseId);
    let taughtBy = req.query.adminId;
    let batch = parseInt(req.query.batch);
    try {
        const students = await Student.find({
            "courses": {
                $elemMatch: {
                    "taughtBy": taughtBy,
                    "courseId": courseId,
                    "batch": batch
                }
            }
        }).select("name email mobile studentId.$");
        res.send(students);
    }
    catch (error) {
        console.error('Error finding students:', error);
    }
})

app.get("/studentDetails", async (req, res) => {
    // console.log(req.query)
    let id = parseInt(req.query.studentId);

    try {
        const student = await Student.findOne({ studentId: id });
        if (!student) {
            console.log('Student not found');
            return;
        }

        const coursesDetails = [];

        for (const course of student.courses) {
            const courseDetail = await Course.findOne({ courseId: course.courseId });
            if (courseDetail) {
                coursesDetails.push({
                    presentLevel: course.level,
                    courseDetails: {
                        courseId: courseDetail.courseId,
                        courseName: courseDetail.courseName,
                        numberOfLevels: courseDetail.levels.length
                    },
                    // taughtBy:course.taughtBy
                });
            }
        }

        const result = {
            name: student.name,
            studentId: student.studentId,
            mobile: student.mobile,
            courses: coursesDetails,
            dp: student.dp
        };
        res.send(result);
        // console.log(result);
    } catch (error) {
        console.error('Error finding student:', error);
    }
})

app.get("/sudoTeacherList", async (req, res) => {
    // console.log(req.query)
    try {
        const teachers = await Admin.find({ "courses.courseId": parseInt(req.query.courseId) }).select(`name adminId mobile email`)
        res.send(teachers);
    }
    catch (error) {
        console.log(error)
    }
});

app.get("/superAdminDetails", async (req, res) => {
    // console.log(req.query)
    try {
        let sudo = await SuperAdmin.findOne({ superAdminId: parseInt(req.query.superAdminId) })
        // console.log(sudo)
        res.send(sudo)
    }
    catch (error) {
        console.log(error)
    }
})

app.get("/allTeachers", async (req, res) => {
    try {
        const teachers = await Admin.find({}).select(`name adminId mobile email`)
        res.send(teachers);
    }
    catch (error) {
        console.log(error)
    }
});

app.get("/getQuestion", async (req, res) => {
    // console.log(req.query)
    try {
        let question = await Page.findOne({ courseId: parseInt(req.query.courseId), level: parseInt(req.query.level), pageNumber: parseInt(req.query.pageNumber) })
        res.send(question.content)
    }
    catch (error) {
        console.log(error)
    }
})

app.get("/getTemplateType", async (req, res) => {
    // console.log(req.query)
    try {
        let question = await Page.findOne({ courseId: parseInt(req.query.courseId), level: parseInt(req.query.level), pageNumber: parseInt(req.query.pageNumber) })
        if (question) {
            res.send({ templateType: question.templateType })
        }
        else {
            res.send("resource not found")
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.get("/getStudentLevel", async (req, res) => {
    // console.log(req.query)
    try {
        const student = await Student.findOne({ studentId: parseInt(req.query.studentId) });

        if (!student) {
            throw new Error('Student not found');
        }

        const course = student.courses.find(course => course.courseId === parseInt(req.query.courseId));

        if (!course) {
            res.send("not found")
        }
        else {
            res.send({
                level: course.level
            })
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.get("/getProgressStudent", async (req, res) => {
    // console.log(req.query)
    try {
        let progress = await Submission.findOne({ studentId: parseInt(req.query.studentId), courseId: parseInt(req.query.courseId), pageNumber: parseInt(req.query.pageNumber), level: parseInt(req.query.level) })
        if (progress) {
            res.send({
                state: progress.state,
                submission: progress.submission
            })
        }
        else {
            res.send("not found")
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.get("/getSubmissions", async (req, res) => {
    // console.log(req.query)
    try {
        let submissions = await Submission.find({ courseId: parseInt(req.query.courseId), studentId: parseInt(req.query.studentId), state: 1 })
        let pageNumbers = submissions.map(submission => submission.pageNumber);
        res.send(pageNumbers)
    }
    catch (error) {
        console.log(error)
    }
})

app.post("/newEvent", async (req, res) => {
    console.log(req.body)
    try {
        if (!req.body.image || req.body.image === "") {
            let obj = new Event({
                name: req.body.name,
                about: req.body.about,
                date: new Date(req.body.date),
                venue: req.body.venue,
                image:""
            })
            await obj.save()
            res.send("done")
        }
        else {
            const result = await cloudinary.uploader.upload(req.body.image, options);
            if (result && result.url) {
                let obj = new Event({
                    name: req.body.name,
                    about: req.body.about,
                    date: new Date(req.body.date),
                    image: result.url,
                    venue: req.body.venue
                })
                await obj.save()
                res.send("done")
            }
        }

    }
    catch (error) {
        console.log(error)
    }
})

app.post("/teacherSubmit", async (req, res) => {
    // console.log(req.query)
    try {
        if (!req.query.wrongs) {
            await Submission.updateOne({ studentId: parseInt(req.query.studentId), courseId: parseInt(req.query.courseId), pageNumber: parseInt(req.query.pageNumber), level: parseInt(req.query.level) }, { $set: { state: 2, "submission.wrong": [] } })
            res.send("done")
        }
        else {
            await Submission.updateOne({ studentId: parseInt(req.query.studentId), courseId: parseInt(req.query.courseId), pageNumber: parseInt(req.query.pageNumber), level: parseInt(req.query.level) }, { $set: { state: 0, "submission.wrong": req.query.wrongs } })
            res.send("done")
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.post("/studentSubmit", async (req, res) => {
    // console.log(req.query)
    try {
        let submission = await Submission.findOne({ studentId: parseInt(req.query.studentId), courseId: parseInt(req.query.courseId), pageNumber: parseInt(req.query.pageNumber), level: parseInt(req.query.level) })
        if (submission) {
            await Submission.updateOne({
                studentId: parseInt(req.query.studentId),
                courseId: parseInt(req.query.courseId),
                pageNumber: parseInt(req.query.pageNumber),
                level: parseInt(req.query.level)
            }, {
                $set: {
                    state: 1,
                }
            });

            if (submission.submission.buffer.Btable1.length > 0) {
                submission.submission.buffer.Btable1.forEach((value, index) => {
                    if (value !== null) {
                        submission.submission.table1[index] = value;
                    }
                });
                submission.submission.buffer.Btable1 = [];
            }
            if (submission.submission.buffer.Btable2.length > 0) {
                submission.submission.buffer.Btable2.forEach((value, index) => {
                    if (value !== null) {
                        submission.submission.table2[index] = value;
                    }
                });
                submission.submission.buffer.Btable2 = [];
            }
            if (submission.submission.buffer.Btable3.length > 0) {
                submission.submission.buffer.Btable3.forEach((value, index) => {
                    if (value !== null) {
                        submission.submission.table3[index] = value;
                    }
                });
                submission.submission.buffer.Btable3 = [];
            }
            await submission.save();
            res.send("done")
        }
        else {
            res.send("not found")
        }
    }
    catch (error) {
        console.log(error)
    }
})


app.post("/updateProgress", async (req, res) => {
    // console.log(req.query)
    try {
        let sub = await Submission.findOne({ studentId: parseInt(req.query.studentId), courseId: parseInt(req.query.courseId), pageNumber: parseInt(req.query.pageNumber), level: parseInt(req.query.level) })
        if (sub) {
            if (sub.submission.wrong.length == 0) {
                await Submission.updateOne({
                    studentId: parseInt(req.query.studentId),
                    courseId: parseInt(req.query.courseId),
                    pageNumber: parseInt(req.query.pageNumber),
                    level: parseInt(req.query.level)
                }, {
                    $set: {
                        "submission.table1": req.query.submission.table1,
                        "submission.table2": req.query.submission.table2,
                        "submission.table3": req.query.submission.table3,
                        "submission.wrong": sub.submission.wrong
                    }
                });
                res.send("done")
            }
            else {
                await Submission.updateOne({
                    studentId: parseInt(req.query.studentId),
                    courseId: parseInt(req.query.courseId),
                    pageNumber: parseInt(req.query.pageNumber),
                    level: parseInt(req.query.level)
                }, {
                    $set: {
                        "submission.buffer.Btable1": req.query.submission.table1,
                        "submission.buffer.Btable2": req.query.submission.table2,
                        "submission.buffer.Btable3": req.query.submission.table3,
                    }
                });
                res.send("done")
            }
        }
        else {
            let obj = new Submission({
                studentId: parseInt(req.query.studentId),
                courseId: parseInt(req.query.courseId),
                level: parseInt(req.query.level),
                pageNumber: parseInt(req.query.pageNumber),
                state: 0,
                submission: {
                    table1: req.query.submission.table1,
                    table2: req.query.submission.table2,
                    table3: req.query.submission.table3,
                    wrong: []
                }
            })
            await obj.save()
            res.send("done")
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.post("/newQuestion", async (req, res) => {
    // console.log(req.query)
    try {
        let page = await Page.findOne({ courseId: parseInt(req.query.courseId), level: parseInt(req.query.level), pageNumber: parseInt(req.query.pageNumber) })
        if (page) {
            res.send("Question already exists")
        }
        else {
            let obj = new Page({
                courseId: parseInt(req.query.courseId),
                level: parseInt(req.query.level),
                templateType: parseInt(req.query.templateType),
                pageNumber: parseInt(req.query.pageNumber),
                content: req.query.content
            })
            await obj.save()
            res.send("Question added")
        }
    }
    catch (error) {
        console.log(error)
        res.send("Failed to add question")
    }
})


//upload resources
app.post('/upload', async (req, res) => {
    // console.log(req.body)
    imagePath = req.body.image;
    try {
        const result = await cloudinary.uploader.upload(imagePath, options);
        // console.log(result);
        if (result.url) {
            Course.findOneAndUpdate({ courseName: req.body.courseName, "levels.level": parseInt(req.body.level) }, { $push: { 'levels.$.resources': result.url } }).then(() => {
                console.log("Resource added")
                res.send("Resource added")
            })
        }
        else {
            res.send("Failed to upload")
        }
    } catch (error) {
        console.error(error);
    }
});


app.post("/newStudent", async (req, res) => {
    console.log(req.query)
    try {
        let obj = new Student({
            name: req.query.name,
            mobile: parseInt(req.query.mobile),
            courses: [{
                courseId: parseInt(req.query.course),
                level: 1,
                taughtBy: req.query.adminId,
                batch: 1
            }]
        })
        await obj.save()
        await Admin.findOneAndUpdate(
            { adminId: req.query.adminId, "courses.courseId": parseInt(req.query.course) },
            { $addToSet: { "courses.$.studentList": obj.studentId } },
            { new: true }
        )
        console.log("Student added")
        res.send({ id: obj.studentId })
    }
    catch (error) {
        console.log(error)
        try {
            const counter = await Counter.findByIdAndUpdate({ _id: 'studentId' }, { $inc: { seq: -1 } }, { new: true, upsert: true });
            this.studentId = counter.seq;
        } catch (error) {
            console.log(error)
        }
        res.send("Failed to add student")
    }

})

app.post("/addStudent", async (req, res) => {
    console.log(req.query)
    try {
        const studentId = parseInt(req.query.studentId);
        const adminId = req.query.adminId;
        const courseId = parseInt(req.query.courseId);
        const isEnrolled = await Student.exists({ studentId: studentId, 'courses.courseId': courseId });

        if (isEnrolled) {
            console.log("Student is already enrolled in the course");
            res.send("Student not found or already enrolled in the selected course");
            return;
        }

        await Student.updateOne(
            { studentId: studentId },
            { $push: { courses: { courseId: courseId, level: 1, taughtBy: adminId, batch: 1 } } }
        );

        await Admin.findOneAndUpdate(
            { adminId: adminId, "courses.courseId": courseId },
            { $addToSet: { "courses.$.studentList": studentId } },
            { new: true }
        )

        console.log("Student added to the course");
        res.send("Student added to the course");
    } catch (error) {
        console.error("Error adding student to the course:", error);
        res.send("Internal Server Error");
    }
});

app.post("/newTeacher", async (req, res) => {
    console.log(req.query)
    let courses = []
    req.query.course && req.query.course.forEach(course => {
        courses.push({
            courseId: parseInt(course),
            studentList: [],
            numberOfBatches: 1
        })
    });
    console.log(courses)
    try {
        let obj = new Admin({
            name: req.query.name,
            email: req.query.email,
            adminId: req.query.id.toLowerCase(),
            mobile: parseInt(req.query.mobile),
            courses: courses,
            profile: req.query.info
        })
        await obj.save()
        await Course.updateMany(
            { courseId: { $in: req.query.course } },
            { $addToSet: { teachers: obj.adminId } }
        )
        res.send({ id: obj.adminId })
    }
    catch (error) {
        console.log(error)
        res.send("Failed to add teacher")
    }
})

app.post("/changeBatch", async (req, res) => {
    // console.log(req.query)
    let studentId = parseInt(req.query.studentId)
    let courseId = parseInt(req.query.courseId)
    let batch = parseInt(req.query.batch)
    try {
        await Student.updateOne(
            { studentId: studentId, "courses.courseId": courseId },
            { $set: { "courses.$.batch": batch } }
        )
        console.log("Batch changed")
        res.send("Batch changed")
    }
    catch (error) {
        console.log(error)
    }
})

app.post("/changeTeacher", async (req, res) => {
    // console.log(req.query)
    try {
        let oldAdminId = (req.query.oldAdminId)
        let newAdminId = (req.query.newAdminId)
        let studentId = parseInt(req.query.studentId)
        let courseId = parseInt(req.query.courseId)

        await Admin.updateOne(
            { adminId: oldAdminId, "courses.courseId": courseId },
            { $pull: { "courses.$.studentList": studentId } }
        );

        await Admin.updateOne(
            { adminId: newAdminId, "courses.courseId": courseId },
            { $addToSet: { "courses.$.studentList": studentId } }
        );

        await Student.updateOne({ studentId: studentId, "courses.courseId": courseId }, { $set: { "courses.$.taughtBy": newAdminId, "courses.$.batch": 1 } });

        console.log("Teacher changed");
        res.send("success");
    }
    catch (error) {
        console.log(error)
    }
});

app.post("/removeStudentFromCourse", async (req, res) => {
    // console.log(req.query)
    let studentId = parseInt(req.query.studentId)
    let courseId = parseInt(req.query.courseId)
    try {
        const course = await Admin.findOne({ 'courses.courseId': courseId });
        if (!course) {
            console.log("Course not found");
            return;
        }
        const studentIndex = course.courses.findIndex(course => course.studentList.includes(studentId));

        if (studentIndex === -1) {
            console.log("Student not found");
            return;
        }
        await Admin.updateOne(
            { 'courses.courseId': courseId },
            { $pull: { 'courses.$.studentList': studentId } }
        );

        await Student.updateOne(
            { studentId: studentId },
            { $pull: { 'courses': { courseId: courseId } } }
        );
        console.log("Student removed");
        res.send("Student removed");
    }
    catch (error) {
        console.log(error)
    }
});

app.post("/removeStudentFromAllCourses", async (req, res) => {
    // console.log(req.query)
    let studentId = parseInt(req.query.studentId)
    try {
        await Admin.updateMany(
            { "courses.studentList": studentId },
            { $pull: { "courses.$.studentList": studentId } }
        );
        await Student.deleteOne(
            { studentId: studentId },
        );
        // await Student.updateOne(
        //     { studentId: studentId },
        //     { $set: { courses: [] } }
        // );
        console.log("Student removed");
        res.send("Student removed");
    }
    catch (error) {
        console.log(error)
    }

});

app.post("/removeTeacherFromCourse", async (req, res) => {
    // console.log(req.query)
    let adminId = (req.query.adminId)
    let courseId = parseInt(req.query.courseId)
    try {
        let admin = await Admin.findOneAndUpdate(
            { 'adminId': adminId },
            { $pull: { 'courses': { courseId, studentList: { $size: 0 } } } }
        );
        console.log(admin)
        if (admin) {
            const hasStudents = admin.courses.some(course => course.studentList.length > 0);

            if (hasStudents) {
                res.send("Admin has students, cannot remove from course.");
            } else {
                await Course.updateOne(
                    { courseId: courseId },
                    { $pull: { teachers: adminId } }
                );
                res.send("success");
            }
        } else {
            res.send("Admin not found or course not found for the admin.");
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.post("/removeTeacherFromAllCourses", async (req, res) => {
    // console.log(req.query)
    let adminId = (req.query.adminId)
    try {
        let admin = await Admin.findOne({ adminId: adminId });
        if (!admin) {
            console.log("Admin not found");
            return;
        }
        const allEmpty = admin.courses.every(course => course.studentList.length === 0);
        if (allEmpty) {
            Admin.deleteOne({ adminId: adminId }).then(() => {
                Course.updateMany(
                    { teachers: adminId },
                    { $pull: { teachers: adminId } })
                    .then(() => {
                        console.log("Admin removed");
                        res.send("success");
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            }).catch((err) => {
                console.log(err)
            })
        }
        else {
            res.send("Admin has students in the course")
        }
    }

    catch (error) {
        console.log(error)
    }
});

app.post("/uploadDP", async (req, res) => {
    // console.log(req.body)
    let id = (req.body.id)
    try {
        const result = await cloudinary.uploader.upload(req.body.image, options);
        // console.log(result);
        if (result && result.url && req.body.role === "admin") {
            let superAdmin = await SuperAdmin.findOne({ superAdminId: parseInt(id) });
            let url = superAdmin.dp;
            if (url && url.startsWith("http")) {
                let publicId = url.split("/")[7].split(".")[0];
                // Use await with cloudinary.uploader.destroy
                const destroyResult = await cloudinary.uploader.destroy(publicId);
                // console.log(destroyResult);
            }
            await SuperAdmin.findOneAndUpdate({ superAdminId: parseInt(id) }, { dp: result.url });
            res.send("Resource added");
        }
        else if (result && result.url && req.body.role === "teacher") {
            let admin = await Admin.findOne({ adminId: id });
            let url = admin.dp;
            if (url && url.startsWith("http")) {
                let publicId = url.split("/")[7].split(".")[0];
                // Use await with cloudinary.uploader.destroy
                const destroyResult = await cloudinary.uploader.destroy(publicId);
                // console.log(destroyResult);
            }
            await Admin.findOneAndUpdate({ adminId: id }, { dp: result.url });
            res.send("Resource added");
        }
        else if (result && result.url && req.body.role === "student") {
            let student = await Student.findOne({ studentId: parseInt(id) })
            let url = student.dp
            console.log("url", url)
            if (url && url.startsWith("http")) {
                let publicId = url.split("/")[7].split(".")[0];
                // Use await with cloudinary.uploader.destroy
                const destroyResult = await cloudinary.uploader.destroy(publicId);
                // console.log(destroyResult);
            }
            await Student.findOneAndUpdate({ studentId: parseInt(id) }, { dp: result.url });
            res.send("Resource added");
        }
        else {
            res.send("Failed to upload");
        }
    }
    catch (error) {
        console.log(error)
    }
});

app.post("/updateClassLink", async (req, res) => {
    // console.log(req.query)
    let courseId = parseInt(req.query.courseId)
    let batch = parseInt(req.query.batch)
    let adminId = (req.query.adminId)
    let classLink = req.query.classLink

    try {
        await Student.updateMany(
            { "courses.courseId": courseId, "courses.batch": batch, "courses.taughtBy": adminId },
            { $set: { "courses.$.classLink": classLink } }
        )
        res.send("Link updated")
        console.log("Link updated")
    }
    catch (error) {
        console.log(error)
    }
});

const PORT = process.env.PORT || 5000
app.listen(PORT)
