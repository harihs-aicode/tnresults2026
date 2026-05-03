import { useState } from "react";
import {
  Container, Grid, Card, CardContent,
  Typography, ToggleButton, ToggleButtonGroup
} from "@mui/material";

import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from "recharts";

export default function SalaryDashboard() {

  const [view, setView] = useState("net");

  const format = (n) => "₹" + Math.round(n).toLocaleString();

  /* ---------- INPUT ---------- */
  const base = 3200000;
  const bonus = 384000;
  const rent = 20000;

  const employerPF = 172800;
  const gratuity = 69120;

  const totalCTC =
    base + bonus + employerPF + gratuity;

  /* ---------- SALARY SPLIT ---------- */
  const basic = base * 0.45;
  const hra = basic * 0.4;
  const allowance = base - (basic + hra);

  /* ---------- HRA ---------- */
  const hraExemption = Math.max(
    0,
    Math.min(
      hra,
      rent * 12 - 0.1 * base,
      0.4 * base
    )
  );

  /* ---------- DEDUCTIONS ---------- */
  const deductionsOld =
    150000 + 25000 + hraExemption;

  const taxableOld = totalCTC - deductionsOld;
  const taxableNew = totalCTC - 50000;

  /* ---------- TAX ---------- */
  const taxOld =
    taxableOld <= 250000 ? 0 :
    taxableOld <= 500000 ? (taxableOld - 250000) * 0.05 :
    taxableOld <= 1000000 ? 12500 + (taxableOld - 500000) * 0.2 :
    112500 + (taxableOld - 1000000) * 0.3;

  const taxNew =
    taxableNew <= 300000 ? 0 :
    taxableNew <= 600000 ? (taxableNew - 300000) * 0.05 :
    taxableNew <= 900000 ? 15000 + (taxableNew - 600000) * 0.1 :
    taxableNew <= 1200000 ? 45000 + (taxableNew - 900000) * 0.15 :
    taxableNew <= 1500000 ? 90000 + (taxableNew - 1200000) * 0.2 :
    150000 + (taxableNew - 1500000) * 0.3;

  /* ---------- NET ---------- */
  const netOld = totalCTC / 12 - taxOld / 12 - 14400 - 200;
  const netNew = totalCTC / 12 - taxNew / 12 - 14400 - 200;

  const best = netNew > netOld ? "NEW" : "OLD";

  /* ---------- CHART DATA ---------- */
  const netChart = [
    { name: "Old", value: netOld },
    { name: "New", value: netNew }
  ];

  const taxChart = [
    { name: "Old", value: taxOld },
    { name: "New", value: taxNew }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>

      <Typography variant="h4" gutterBottom>
        💰 Salary Intelligence Dashboard
      </Typography>

      {/* TOGGLE */}
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(e, val) => val && setView(val)}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="net">Net</ToggleButton>
        <ToggleButton value="gross">Gross</ToggleButton>
      </ToggleButtonGroup>

      {/* KPI CARDS */}
      <Grid container spacing={3}>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography>New Regime</Typography>
              <Typography color="green" variant="h6">
                {format(netNew)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography>Old Regime</Typography>
              <Typography color="red" variant="h6">
                {format(netOld)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography>Best</Typography>
              <Typography color="orange" variant="h6">
                {best} Regime
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* CHARTS */}
      <Grid container spacing={3} sx={{ mt: 2 }}>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography>Net Comparison</Typography>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={netChart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography>Tax Comparison</Typography>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taxChart}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>

            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* BREAKDOWN */}
      <Grid container spacing={3} sx={{ mt: 2 }}>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Salary Breakdown</Typography>

              <Typography>Basic: {format(basic)}</Typography>
              <Typography>HRA: {format(hra)}</Typography>
              <Typography>Allowance: {format(allowance)}</Typography>
              <Typography sx={{ mt: 1 }}>
                Total CTC: {format(totalCTC)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Deductions</Typography>

              <Typography>80C: ₹1,50,000</Typography>
              <Typography>80D: ₹25,000</Typography>
              <Typography>HRA Exemption: {format(hraExemption)}</Typography>

              <Typography sx={{ mt: 1 }}>
                Tax Old: {format(taxOld)}
              </Typography>

              <Typography>
                Tax New: {format(taxNew)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

    </Container>
  );
}