resource "aws_cloudwatch_log_group" "ai_backend_logs" {
  name              = "/ecs/notes-rag-logs"
  retention_in_days = 7
}