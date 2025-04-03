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
        unique:true
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

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    about: String , 
    date: Date,
    venue : String,
    image : String,
});

const Event = mongoose.model("event", eventSchema);

const pageSchema = new mongoose.Schema({
    pageNumber: {
        type: Number,
        required: true,
    },
    courseId: {
        type: Number,
        required: true,
    },
    level: {
        type: Number,
        required: true,
    },
    templateType :Number,
    content : {
        table1 : [[Number]],
        table2 : [[Number]],
        table3 : [[Number]],
        table4 : [[Number]],
    }
});
const Page = mongoose.model("page", pageSchema);

const submissionSchema = new mongoose.Schema({
    studentId: {
        type: Number,
        required: true,
    },
    courseId: {
        type: Number,
        required: true,
    },
    level: {
        type: Number,
        required: true,
    },
    pageNumber: {
        type: Number,
        required: true,
    },
    state:Number , //initial - 0 , completed - 2 , resubmitted - 1
    submission : {
        table1 : [Number],
        table2 : [Number],
        table3 : [Number],
        wrong : [{
            table : String,
            qn : Number,
        }],
        buffer:{
            Btable1 : [Number],
            Btable2 : [Number],
            Btable3 : [Number],
        }
    }
});

const Submission = mongoose.model("submission", submissionSchema);

module.exports = { SuperAdmin, Course, Admin, Student , Counter , Event , Page , Submission};

