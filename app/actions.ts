export async function createInspection(formData: FormData) {
  const projectId = formData.get('projectId') as string
  const inspector = formData.get('inspector') as string
  
  await prisma.inspection.create({
    data: { 
      projectId: parseInt(projectId), 
      inspector,
      status: 'Scheduled'
    }
  })
  
  revalidatePath(`/inspections/${projectId}`)
  revalidatePath('/')
}
