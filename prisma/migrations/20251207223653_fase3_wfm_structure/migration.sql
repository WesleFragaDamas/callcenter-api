-- CreateTable
CREATE TABLE "distribution_curves" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "intervals" JSONB NOT NULL,

    CONSTRAINT "distribution_curves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "dateReference" TIMESTAMP(3),
    "totalVolume" INTEGER NOT NULL,
    "aht" INTEGER NOT NULL,
    "slaTarget" DOUBLE PRECISION NOT NULL,
    "slaTime" INTEGER NOT NULL,
    "curveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_items" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "requiredAgents" INTEGER NOT NULL,
    "scheduledAgents" INTEGER NOT NULL,
    "projectedSLA" DOUBLE PRECISION NOT NULL,
    "occupancy" DOUBLE PRECISION,

    CONSTRAINT "simulation_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_curveId_fkey" FOREIGN KEY ("curveId") REFERENCES "distribution_curves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_items" ADD CONSTRAINT "simulation_items_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
