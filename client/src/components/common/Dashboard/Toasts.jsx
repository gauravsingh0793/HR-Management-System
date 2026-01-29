import { useToast } from "../../../hooks/use-toast.js"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"
import { useSelector, useDispatch } from "react-redux"
import { useEffect, useRef, useState } from "react"
import { HandlePostHREmployees } from "../../../redux/Thunks/HREmployeesThunk.js"
export const FormSubmitToast = ({ formdata, onSuccess, onAdd }) => {
    const { toast } = useToast()
    const dispatch = useDispatch()
    const HREmployeesState = useSelector((state) => state.HREmployeesPageReducer)
    const prevFetchDataRef = useRef(false)


    const SubmitFormData = async () => {
        // Validate password fields
        if (!formdata.password || !formdata.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Uh oh! Password fields are required.",
                description: "Please enter and confirm your password.",
            })
            return
        }

        if (formdata.password !== formdata.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Passwords do not match.",
                description: "Please make sure your passwords match.",
            })
            return
        }

        // Create payload with only required fields for employee creation
        const payload = {
            firstname: formdata.firstname,
            lastname: formdata.lastname,
            email: formdata.email,
            contactnumber: formdata.contactnumber,
            password: formdata.password,
        }

        // Add department if selected
        if (formdata.department) {
            payload.department = formdata.department
        }

        if (onAdd) onAdd()
        dispatch(HandlePostHREmployees({ apiroute: "ADDEMPLOYEE", data: payload })) 
    }

    // const DisplayToast = () => {
    //     if (HREmployeesState.error.status) {
    //         return toast({
    //             variant: "destructive",
    //             title: "Uh oh! Something went wrong.",
    //             description: `${HREmployeesState.error.message}`,
    //             // action: <ToastAction altText="Try again">Try again</ToastAction>,
    //         })
    //     } else if (HREmployeesState.fetchData) {
    //         return toast({
    //             title: <p className="text-xl m-1">Success!</p>,
    //             description: <div className="flex justify-center items-center gap-2">
    //                 <img src="../../src/assets/HR-Dashboard/correct.png" alt="" className="w-8" />
    //                 <p className="font-bold">Employee added successfully.</p>
    //             </div>,
    //         })
    //     }
    // }

    // Close dialog when employee is successfully added
    useEffect(() => {
        if (HREmployeesState.fetchData && !prevFetchDataRef.current && !HREmployeesState.isLoading) {
            if (onSuccess) {
                onSuccess()
            }
        }
        prevFetchDataRef.current = HREmployeesState.fetchData
    }, [HREmployeesState.fetchData, HREmployeesState.isLoading, onSuccess])

    console.log(HREmployeesState, "This is the HR plus Employees State")
    return (
        <>
            <Button
                variant="outline"
                onClick={() => {
                    SubmitFormData()
                    // HREmployeesState.error.status ? toast({
                    //     variant: "destructive",
                    //     title: "Uh oh! Something went wrong.",
                    //     description: `${HREmployeesState.error.message}`,
                    //     // action: <ToastAction altText="Try again">Try again</ToastAction>,
                    // }) : null
                    // HREmployeesState.fetchData ? toast({
                    //     title: <p className="text-xl m-1">Success!</p>,
                    //     description: <div className="flex justify-center items-center gap-2">
                    //         <img src="../../src/assets/HR-Dashboard/correct.png" alt="" className="w-8" />
                    //         <p className="font-bold">Employee added successfully.</p>
                    //     </div>,
                    // }) : null
                }}
                className="bg-blue-800 border-2 border-blue-800 px-4 py-2 text-white font-bold rounded-lg hover:bg-white hover:text-blue-800"
            >
                Add Employee
            </Button>
        </>
    )
}