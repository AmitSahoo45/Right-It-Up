-- TO BE DONE LATER
-- THIS HASN'T BEEN IMPLEMENTED YET

alter policy "Cases are viewable by anyone with the code"
on "public"."cases"
to public
using (true);

alter policy "Party B can update to add response"
on "public"."cases"
to public
using (
  (((status)::text = 'pending_response'::text) AND (party_b_argument IS NULL))
) with check (
  true
);

alter policy "Users can create cases"
on "public"."cases"
to public
with check (
  true
);

alter policy "System can insert usage"
on "public"."verdict_usage"
to public
with check (
  true
);

alter policy "Users see own usage"
on "public"."verdict_usage"
to public
using (
  ((auth.uid() = user_id) OR (user_id IS NULL))
);

alter policy "System can create verdicts"
on "public"."verdicts"
to public
with check (
  true
);

alter policy "Verdicts viewable by case participants"
on "public"."verdicts"
to public
using (
  (EXISTS ( SELECT 1
   FROM cases c
  WHERE (c.id = verdicts.case_id)))
);