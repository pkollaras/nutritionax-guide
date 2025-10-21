-- Allow nutritionists to manage (INSERT/UPDATE/DELETE) progress reports for their clients
CREATE POLICY "Nutritionists can manage client progress"
ON progress_reports
FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT client_id 
    FROM client_nutritionists
    WHERE nutritionist_id IN (
      SELECT id FROM nutritionists WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id IN (
    SELECT client_id 
    FROM client_nutritionists
    WHERE nutritionist_id IN (
      SELECT id FROM nutritionists WHERE user_id = auth.uid()
    )
  )
);