import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'UNKNOWN', message: 'Missing taskId' }, { status: 400 });
  }

  // Do not report a generated result: the matching legacy start route does not
  // create or persist tasks, so no task ID can have a real status here.
  return NextResponse.json(
    { taskId, status: 'not_found', error: 'TASK_NOT_FOUND', message: 'No active try-on task matches this ID.' },
    { status: 404 }
  );
}
