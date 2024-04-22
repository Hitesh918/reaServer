let express = require('express');
let mongoose = require('mongoose')
const cors = require("cors");
const { SuperAdmin, Course, Admin, Student , Counter} = require('./schema');
let cloudinary = require('cloudinary').v2;

const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {SpacesServiceClient} = require('@google-apps/meet').v2;
const { auth } = require('google-auth-library');


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

const SCOPES = ['https://www.googleapis.com/auth/meetings.space.created'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');


/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      return auth.fromJSON(credentials);
    } catch (err) {
      console.log(err);
      return null;
    }
  }
  
  /**
   * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
   *
   * @param {OAuth2Client} client
   * @return {Promise<void>}
   */
  async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
  }
  
  /**
   * Load or request or authorization to call APIs.
   *
   */
  async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  }
  
  /**
   * Creates a new meeting space.
   * @param {OAuth2Client} authClient An authorized OAuth2 client.
   */
  async function createSpace(authClient) {
    const meetClient = new SpacesServiceClient({
      authClient: authClient
    });
    // Construct request
    const request = {
    };
  
    // Run request
    const response = await meetClient.createSpace(request);
    return response[0].meetingUri;
}



app.get('/api/createMeeting', async (req, res) => {
    try {
      const authClient = await authorize();
      const meetingLink = await createSpace(authClient);
      res.json({ meetingLink });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create meeting space' });
    }
  });

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
        console.log(courses);

        res.send(courses);
    } catch (error) {
        console.error('Error finding courses:', error);
    }
})

app.get("/getCourseDetails", async (req, res) => {
    console.log(req.query)
    try {
        const stud = await Student.findOne({ studentId: req.query.studentId });
        if (!stud) {
            console.log('Student not found');
            return;
        }
        let teacherName = stud.courses.find((course) => { if (course.courseId == req.query.courseId) { return course.taughtBy } })
        console.log(teacherName)
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

//get resources

app.get("/getResources", async (req, res) => {
    console.log(req.query)
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
        console.log(resources);
    } catch (error) {
        console.error('Error finding course:', error);
    }
})

app.get("/getClassLink", async (req, res) => {
    console.log(req.query)
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
        console.log(course)
        res.send(course);
    }
    catch (error) {
        console.error('Error finding course:', error);
    }
})

//courses thought by teachers
app.get("/adminDetails", async (req, res) => {
    console.log(req.query)
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
        console.log(result);
    } catch (error) {
        console.error('Error finding admin:', error);
    }

})

//student list given a course id and teacherid , returns level wise ,  all
app.get("/getStudentsUnderTeacher", async (req, res) => {

    console.log(req.query)
    let taughtBy = req.query.adminId
    // let adminId = parseInt(req.query.adminId)
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
    console.log(req.query)
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

//courses in which student is enrolled , returns full courses details
app.get("/studentDetails", async (req, res) => {
    console.log(req.query)
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
                    }
                });
            }
        }

        const result = {
            name: student.name,
            studentId: student.studentId,
            mobile: student.mobile,
            courses: coursesDetails,
            dp:student.dp
        };
        res.send(result);
        console.log(result);
    } catch (error) {
        console.error('Error finding student:', error);
    }
})

app.get("/sudoTeacherList", async (req, res) => {
    console.log(req.query)
    try {
        const teachers = await Admin.find({ "courses.courseId": parseInt(req.query.courseId) }).select(`name adminId mobile email`)
        res.send(teachers);
    }
    catch (error) {
        console.log(error)
    }
});

app.get("/superAdminDetails", async (req, res) => {
    console.log(req.query)
    try {
        let sudo = await SuperAdmin.findOne({ superAdminId: parseInt(req.query.superAdminId) })
        console.log(sudo)
        res.send(sudo)
    }
    catch (error) {
        console.log(error)
    }
})

//upload resources
app.post('/upload', async (req, res) => {
    // console.log(req.body)
    imagePath = req.body.image;
    try {
        // Upload the image
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
        // res.send(result);
        // return result.public_id;
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
    try {
        const studentId = parseInt(req.query.studentId);
        const adminId = req.query.adminId;
        const courseId = parseInt(req.query.courseId);

        // Check if the student is already enrolled in the course
        const isEnrolled = await Student.exists({ studentId: studentId, 'courses.courseId': courseId });

        if (isEnrolled) {
            console.log("Student is already enrolled in the course");
            res.send("Student not found or already enrolled in the selected course");
            return;
        }

        // If the student is not enrolled, add them to the course
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
    req.query.course.forEach(course => {
        courses.push({
            courseId: parseInt(course),
            studentList: [],
            numberOfBatches: 1
        })
    });
    try {
        let obj = new Admin({
            name: req.query.name,
            email: req.query.email,
            adminId: req.query.id,
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
    console.log(req.query)
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
    console.log(req.query)
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
    console.log(req.query)
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
    console.log(req.query)
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
    console.log(req.query)
    let adminId = (req.query.adminId)
    let courseId = parseInt(req.query.courseId)
    // try {
    //     let resp = await Admin.findOneAndUpdate(
    //         { 'adminId': adminId, 'courses.courseId': courseId, 'courses.studentList': { $exists: true, $eq: [] } },
    //         { $pull: { 'courses': { 'courseId': courseId } } }
    //     );
    //     console.log(resp)
    //     if (resp) {
    //         await Course.updateOne(
    //             { courseId: courseId },
    //             { $pull: { teachers: adminId } }
    //         );
    //         res.send("success");
    //     }
    //     else {
    //         res.send("Admin has students in the course")
    //     }
    //     // console.log("Teacher removed");
    //     // res.send("success");
    // }
    try {
        let admin = await Admin.findOneAndUpdate(
            { 'adminId': adminId, 'courses.courseId': courseId },
            { $pull: { 'courses': { 'courseId': courseId } } }
        );
        console.log(admin)
        if (admin) {
            let course = await Course.findOne({ courseId: courseId });
            if (course && course.studentList.length === 0) {
                await Course.updateOne(
                    { courseId: courseId },
                    { $pull: { teachers: adminId } }
                );
                res.send("success");
            } else {
                res.send("Admin has students in the course");
            }
        } else {
            res.send("Admin not found or course not found for the admin");
        }
    }
    catch (error) {
        console.log(error)
    }
})

app.post("/removeTeacherFromAllCourses", async (req, res) => {
    console.log(req.query)
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
    console.log(req.body)
    let id = (req.body.id)
    try {
        const result = await cloudinary.uploader.upload(req.body.image, options);
        console.log(result);
        if (result && result.url && req.body.role === "admin") {
            let superAdmin = await SuperAdmin.findOne({ superAdminId: parseInt(id) });
            let url = superAdmin.dp;
            if (url && url.startsWith("http")) {
                let publicId = url.split("/")[7].split(".")[0];
                // Use await with cloudinary.uploader.destroy
                const destroyResult = await cloudinary.uploader.destroy(publicId);
                console.log(destroyResult);
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
                console.log(destroyResult);
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
                console.log(destroyResult);
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
    console.log(req.query)

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

const PORT=process.env.PORT||5000
app.listen(PORT)

// app.listen(5000, () => {
//     console.log('Server is running on port 5000');
// });
