import { Router, Request, Response } from "express";
import { getAllAppointments, findAppointmentByPhone, cancelAppointment } from "../services/appointmentService";

export const appointmentRouter = Router();

// GET /appointments — list all (admin use)
appointmentRouter.get("/", (_req: Request, res: Response) => {
  res.json(getAllAppointments());
});

// GET /appointments/lookup?phone=91XXXXXXXXXX
appointmentRouter.get("/lookup", (req: Request, res: Response) => {
  const phone = req.query.phone as string;
  if (!phone) { res.status(400).json({ error: "phone query param required" }); return; }
  const appt = findAppointmentByPhone(phone);
  if (!appt) { res.status(404).json({ error: "No appointment found" }); return; }
  res.json(appt);
});

// DELETE /appointments/:id
appointmentRouter.delete("/:id", (req: Request, res: Response) => {
  const success = cancelAppointment(req.params.id);
  if (!success) { res.status(404).json({ error: "Appointment not found" }); return; }
  res.json({ message: "Appointment cancelled" });
});
