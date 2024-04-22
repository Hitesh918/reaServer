let mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 24000 }
  });
  const Counter = mongoose.model('Counter', CounterSchema);

let superAdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },  
    name: {
        type: String,
        required: true,
    },
    superAdminId: {
        type: Number,
        required: true,
    },
    mobile: {
        type: Number,
        required: true,
        unique : true
    },
    dp:
    {
        type: String,
        default:"images/pic-1.jpg"
    }
});

const SuperAdmin = mongoose.model("superAdmins", superAdminSchema);

let courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
    },
    courseId: {
        type: Number,
        required: true,
    },
    teachers: [String],
    levels: [{
        level: {
            type: Number,
            required: true,
        },
        resources: [{
            type: String,
            required: true,
        }]
    }]
});

const Course = mongoose.model("course", courseSchema);

let adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    profile:
    {
        type: String
    },
    name: {
        type: String,
        required: true,
    },
    adminId: {
        type: String,
        required: true,
    },
    dp:{
        type : String,
        default:"images/pic-1.jpg"

    },
    courses: [{
        courseId: {
            type: Number,
            required: true,
        },
        studentList: [Number],
        numberOfBatches: Number
    }],
    mobile: {
        type: Number,
        required: true,
        unique : true
    },
});
// adminSchema.pre('save', async function(next) {
//     if (!this.adminId) {
//       try {
//         const counter = await Counter.findByIdAndUpdate({ _id: 'adminId' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
//         this.adminId = counter.seq;
//         next();
//       } catch (error) {
//         next(error);
//       }
//     } else {
//       next();
//     }
//   });

const Admin = mongoose.model("admin", adminSchema);

let studentSchema = new mongoose.Schema({
    email: {
        type: String,
        // required: true,
        // unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    studentId: {
        type: Number,
        // required: true,
    },
    mobile: {
        type: Number,
        required: true,
        unique : true
    },
    dp:
    {
        type: String,
        default:"images/pic-1.jpg"
    },
    courses: [{
        courseId: {
            type: Number,
            required: true,
        },
        level: {
            type: Number,
            required: true,
        },
        taughtBy: {
            type: String,
            required: true
        },
        batch:Number,
        classLink:{
            type : String,
            default : "http://www.google.com/"
        }
    }]
});
studentSchema.pre('save', async function(next) {
    if (!this.studentId) {
      try {
        const counter = await Counter.findByIdAndUpdate({ _id: 'studentId' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        this.studentId = counter.seq;
        next();
      } catch (error) {
        next(error);
      }
    } else {
      next();
    }
  });

const Student = mongoose.model("student", studentSchema);

module.exports = { SuperAdmin, Course, Admin, Student , Counter};


//assignments , same throughout the course???
//quizes , due dates , logs
